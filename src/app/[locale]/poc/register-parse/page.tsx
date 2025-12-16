'use client';

import { useState } from 'react';
import { fido2ClientService } from '@/lib/fido2-client';
import { bufferToBase64Url, ICoordinates, parsePublicKeyCoordinates } from '@/lib/fido2-parse';
import type { IApiResponse } from '@/lib/response';
import type {
  RegisterOptions,
  RegistrationJSON,
  AuthenticateOptions,
} from '@passwordless-id/webauthn/dist/esm/types';
import { packWebAuthnSignature } from '@/lib/webauthn-utils';
import { UserOperation, UserOperationJson, BundlerResponse } from '@/validators';
import { publicClient } from '@/lib/viem';
import { CONTRACT_ADDRESSES, ABIS } from '@/config/contracts';
import { toBigInt } from '@/lib/common';

type IApiSuccessResponse = IApiResponse<RegisterOptions>;
type StatusType = 'idle' | 'loading' | 'success' | 'error';

export default function PocRegisterAndParsePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [xyCoords, setXyCoords] = useState<ICoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for PoC 1 & 2');
  const [statusType, setStatusType] = useState<StatusType>('idle');
  const [challengeBase64, setChallengeBase64] = useState<string | null>(null);

  const addLog = (log: string) => {
    console.log(log);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setXyCoords(null);
    setLogs([]);
    setStatusMessage('Loading...');
    setStatusType('loading');
    try {
      // Info: (20251111 - Tzuhan) 1. 呼叫我們現有的 API Route
      addLog(
        '[PoC 1.2] Fetching registration options from /api/v1/secure/webauthn-options?intent=register ...'
      );
      const response = await fetch('/api/v1/secure/webauthn-options?intent=register');
      const apiResponse: IApiSuccessResponse | IApiResponse<null> = await response.json();
      if (!response.ok || !apiResponse.success || !apiResponse.payload) {
        throw new Error((apiResponse as IApiResponse<null>).message || 'Failed to fetch options');
      }

      const options: RegisterOptions = apiResponse.payload;
      addLog('[PoC 1.2] Successfully fetched options.');

      // Info: (20251112 - Tzuhan) 2. [PoC 1-1 AC #2] 呼叫現有的 fido2ClientService
      addLog('[PoC 1.1] Calling fido2ClientService.startRegistration()...');
      setStatusMessage('Please create your Passkey in the browser prompt...');
      const credential: RegistrationJSON = await fido2ClientService.startRegistration(options);
      addLog('[PoC 1.1] Passkey created successfully!');

      // Info: (20251112 - Tzuhan) 3. [PoC 1-2 AC #2] 呼叫 PoC 1-2 核心實作
      const attestationObjectBase64 = credential.response.attestationObject;
      if (!attestationObjectBase64) {
        throw new Error('attestationObject is missing from credential response.');
      }
      addLog('[PoC 1.2] Parsing attestationObject to find public key coordinates...');
      setStatusMessage('Parsing coordinates...');
      const coords = parsePublicKeyCoordinates(attestationObjectBase64);

      if (coords) {
        // Info: (20251111 - Tzuhan) 4. [PoC 1-2 AC #3] 瀏覽器 console.log 正確輸出了 { x: '...', y: '...' }
        addLog(`[PoC 1.2] SUCCESS! Found coordinates. x: ${coords.x}, y: ${coords.y}`);
        setXyCoords(coords);
        setStatusMessage('✅ Passkey Registered! (請更新 .env 並重新部署合約)');
        setStatusType('success');
      } else {
        throw new Error('Failed to parse coordinates from attestationObject.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          addLog('[PoC 1.1] ERROR: User cancelled the FIDO2 operation.');
          setStatusMessage('❌ Operation canceled by user.');
        } else {
          addLog(`[PoC 1.x] ERROR: ${error.message}`);
          setStatusMessage('❌ PoC Failed');
        }
      } else {
        addLog('[PoC 1.x] ERROR: An unknown error occurred.');
        setStatusMessage('❌ PoC Failed');
      }
      setXyCoords(null);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginCheck = async () => {
    setIsLoading(true);
    setLogs([]);
    setStatusMessage('Checking existing Passkey...');
    try {
      // Info: (20251120 - Tzuhan) 隨機挑戰，僅用於喚起 Passkey 視窗確認
      const randomChallenge = bufferToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
      const options: AuthenticateOptions = {
        challenge: randomChallenge,
        userVerification: 'required',
      };
      await fido2ClientService.startLogin(options);
      addLog('[Login Check] Success! 您擁有有效的 Passkey。');
      setStatusMessage('✅ Passkey Available (可進行交易)');
      setStatusType('success');
    } catch (e) {
      addLog(`[Login Check] Failed: ${(e as Error).message}`);
      setStatusMessage('❌ No valid Passkey found');
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRealSignatureTest = async () => {
    setIsLoading(true);
    setLogs([]);
    setStatusMessage('Starting PoC 3a (Real Signature)...');
    setStatusType('loading');
    addLog('[PoC 3a] 開始 E2E 測試：產生真實 UserOp 並簽名');

    if (!CONTRACT_ADDRESSES.ENTRY_POINT || !CONTRACT_ADDRESSES.SCW) {
      addLog('❌ 錯誤：請先設定合約地址');
      setIsLoading(false);
      return;
    }

    try {
      // Info: (20251120 - Tzuhan) 1. 從鏈上獲取最新的 Nonce
      addLog('[PoC 3a] 1. Fetching Nonce from EntryPoint...');
      const nonce = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ENTRY_POINT,
        abi: ABIS.ENTRY_POINT,
        functionName: 'getNonce',
        args: [CONTRACT_ADDRESSES.SCW, BigInt(0)],
      });
      addLog(`[PoC 3a] Nonce: ${nonce}`);

      /**
       * Info: (20251121 - Tzuhan) [流程說明] 2. 建構交易意圖 (UserOperation)
       * 這是用戶宣告「我要做什麼」以及「我願意付多少錢」的地方。
       */
      const unsignedUserOp: UserOperation = {
        sender: CONTRACT_ADDRESSES.SCW,
        nonce: nonce,
        initCode: '0x',
        callData: '0x', // Info: (20251124 - Tzuhan) 目前為空操作 (不轉帳)
        callGasLimit: BigInt(100_000),
        verificationGasLimit: BigInt(500_000),
        preVerificationGas: BigInt(50_000),

        /**
         * Info: (20251121 - Tzuhan) [資金流向] 費率設定
         * 這裡設定了 Gas Price (例如 10 Gwei)。EntryPoint 會根據這個費率計算 SCW 需支付的費用。
         *
         * ★★★ 如果要實現「Relayer 全額買單 (不扣 SCW 錢)」★★★
         * 要將 maxFeePerGas 和 maxPriorityFeePerGas 設為 0：
         * maxFeePerGas: BigInt(0),
         * maxPriorityFeePerGas: BigInt(0),
         * 結果：EntryPoint 計算出 prefund = 0，SCW 不需要付任何錢。
         * 代價：Relayer 發送交易時仍需付 Gas 給礦工，但拿不到退款 (自行吸收成本)。
         */
        maxFeePerGas: BigInt(10_000_000_000),
        maxPriorityFeePerGas: BigInt(2_000_000_000),

        paymasterAndData: '0x', // Info: (20251121 - Tzuhan) 若有 Paymaster 代付，這裡填 Paymaster 地址
        signature: '0x',
      };

      /**
       * Info: (20251121 - Tzuhan) [流程說明] 3. 計算數位指紋 (UserOpHash)
       * 我們將整筆交易 (包含上述費率、nonce、callData) 進行雜湊。
       * 用戶簽名時，是針對這個 Hash 簽名，保證了交易內容不可被篡改。
       */
      const userOpTuple = {
        ...unsignedUserOp,
        sender: CONTRACT_ADDRESSES.SCW as `0x${string}`,
        initCode: '0x' as `0x${string}`,
        callData: '0x' as `0x${string}`,
        paymasterAndData: '0x' as `0x${string}`,
        signature: '0x' as `0x${string}`,
      };

      const userOpHash = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ENTRY_POINT,
        abi: ABIS.ENTRY_POINT,
        functionName: 'getUserOpHash',
        args: [userOpTuple],
      });
      addLog(`[PoC 3a] UserOpHash (Challenge): ${userOpHash}`);

      /**
       * Info: (20251121 - Tzuhan) [流程說明] 4. 生物辨識簽名
       * 將 UserOpHash 作為 Challenge 傳給 Passkey。私鑰從未離開手機。
       */
      const challengeBase64 = bufferToBase64Url(Buffer.from(userOpHash.slice(2), 'hex'));
      setChallengeBase64(challengeBase64);

      /**
       * Info: (20251121 - Tzuhan) 呼叫 FIDO2 API 要求使用者進行生物辨識
       * 這會喚起手機或電腦的生物辨識介面 (指紋、Face ID 等)
       * 用戶通過後，Passkey 會使用內部私鑰對 Challenge 簽名並返回簽名結果。
       * 注意：這裡的 challenge 是 base64url 編碼格式
       * 因為 WebAuthn API 要求的 Challenge 是 byte array，我們在內部會自動轉換。
       */
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: Buffer.from(userOpHash.slice(2), 'hex'),
          rpId: window.location.hostname,
          userVerification: 'required',
          allowCredentials: [],
        },
      })) as PublicKeyCredential;

      const response = assertion.response as AuthenticatorAssertionResponse;

      if (!xyCoords) throw new Error('Public key coordinates are not set from registration.');

      // Info: (20251121 - Tzuhan) [流程說明] 5. 打包簽名
      const packedSignature = packWebAuthnSignature(
        new Uint8Array(response.authenticatorData),
        new TextDecoder().decode(response.clientDataJSON),
        new Uint8Array(response.signature),
        BigInt(xyCoords.x),
        BigInt(xyCoords.y)
      );

      // Info: (20251121 - Tzuhan) [流程說明] 6. 發送給 Relayer
      const signedUserOpJson: UserOperationJson = {
        ...unsignedUserOp,
        nonce: `0x${unsignedUserOp.nonce.toString(16)}`,
        callGasLimit: `0x${unsignedUserOp.callGasLimit.toString(16)}`,
        verificationGasLimit: `0x${unsignedUserOp.verificationGasLimit.toString(16)}`,
        preVerificationGas: `0x${unsignedUserOp.preVerificationGas.toString(16)}`,
        maxFeePerGas: `0x${unsignedUserOp.maxFeePerGas.toString(16)}`,
        maxPriorityFeePerGas: `0x${unsignedUserOp.maxPriorityFeePerGas.toString(16)}`,
        signature: packedSignature,
      };

      const res = await fetch('/api/v1/bundler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userOp: signedUserOpJson,
          entryPointAddress: CONTRACT_ADDRESSES.ENTRY_POINT,
        }),
      });

      const result: BundlerResponse = await res.json();
      addLog('[PoC 3a] Bundler Response:');
      addLog(JSON.stringify(result, null, 2));

      if (result.payload?.transactionHash && result.payload?.status === 'success') {
        addLog('[PoC 3a] 🎉🎉🎉 SUCCESS! 交易成功上鏈！');
        setStatusMessage('✅ PoC 3a SUCCESS');
        setStatusType('success');
      } else {
        throw new Error(result.payload?.error || 'Transaction failed');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`[PoC 3a] FAILED: ${msg}`);
      setStatusMessage('❌ PoC 3a Failed');
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Info: (20251118 - Tzuhan) --- [PoC 2.4 / 2.5] 函式 ---
  const handleTestBundler = async () => {
    setIsLoading(true);
    setXyCoords(null);
    setLogs([]); // Info: (20251118 - Tzuhan) 清空日誌
    setStatusMessage('Loading...');
    setStatusType('loading');
    addLog('[PoC 2.4 / 2.5] Starting Bundler E2E Test...');

    // Info: (20251118 - Tzuhan) (地址檢查現在會通過)
    if (!CONTRACT_ADDRESSES.ENTRY_POINT || !CONTRACT_ADDRESSES.SCW) {
      const err = 'FATAL ERROR: Addresses are not set';
      addLog(err);
      setStatusMessage('❌ Error: 請在程式碼中設定合約地址');
      setStatusType('error');
      setIsLoading(false);
      return;
    }

    try {
      // Info: (20251118 - Tzuhan) 1. 建構一個 BigInt 版本的 UserOperation
      const mockUserOp: UserOperation = {
        sender: CONTRACT_ADDRESSES.SCW as `0x${string}`,
        nonce: BigInt(0),
        initCode: '0x',
        callData: '0x',
        callGasLimit: BigInt(100_000),
        verificationGasLimit: BigInt(150_000),
        preVerificationGas: BigInt(21_000),
        maxFeePerGas: BigInt(10_000_000_000), // Info: (20251118 - Tzuhan) 10 Gwei
        maxPriorityFeePerGas: BigInt(2_000_000_000), // Info: (20251118 - Tzuhan) 2 Gwei
        paymasterAndData: '0x',
        signature: '0xdeadbeef', // Info: (20251118 - Tzuhan) [PoC 2] 假的 stub 簽名
      };
      addLog('[PoC 2.4] Constructed Mock UserOperation (with BigInt):');
      const loggableUserOp = Object.fromEntries(
        Object.entries(mockUserOp).map(([key, value]) => [
          key,
          typeof value === 'bigint' ? value.toString() : value,
        ])
      );
      addLog(JSON.stringify(loggableUserOp, null, 2));

      // Info: (20251118 - Tzuhan) 2. 轉換為 JSON 傳輸格式 (BigInt -> 0x hex string)
      const userOpForJson: UserOperationJson = {
        ...mockUserOp,
        nonce: `0x${mockUserOp.nonce.toString(16)}`,
        callGasLimit: `0x${mockUserOp.callGasLimit.toString(16)}`,
        verificationGasLimit: `0x${mockUserOp.verificationGasLimit.toString(16)}`,
        preVerificationGas: `0x${mockUserOp.preVerificationGas.toString(16)}`,
        maxFeePerGas: `0x${mockUserOp.maxFeePerGas.toString(16)}`,
        maxPriorityFeePerGas: `0x${mockUserOp.maxPriorityFeePerGas.toString(16)}`,
      };
      addLog('[PoC 2.4] Converted to JSON format (0x strings) for API');
      addLog(JSON.stringify(userOpForJson, null, 2));

      // Info: (20251118 - Tzuhan) 3. 將 UserOp 發送給我們的最小 Bundler
      addLog('[PoC 2.4] Sending UserOperation to /api/v1/bundler...');
      setStatusMessage('Sending UserOp to Minimal Bundler...');

      const response = await fetch('/api/v1/bundler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userOp: userOpForJson,
          entryPointAddress: CONTRACT_ADDRESSES.ENTRY_POINT,
        }),
      });

      const result: BundlerResponse = await response.json();
      addLog('[PoC 2.5] Received response from Bundler:');
      addLog(JSON.stringify(result, null, 2));

      // Info: (20251118 - Tzuhan) 4. 檢查 Bundler 的回傳
      if (!result.success) {
        addLog(`[PoC 2.5] FAILED: Bundler API returned success: false. Code: ${result.code}`);
        addLog(`[PoC 2.5] Message: ${result.message}`);
        throw new Error(`Bundler API Error: ${result.message}`);
      }

      const payload = result.payload;
      if (payload?.transactionHash && payload?.status === 'success') {
        addLog('[PoC 2.5] SUCCESS: 交易已上鏈並成功執行。');
        addLog(
          '[PoC 2.5] (INFO) 這意味著我們的 SCW.validateUserOp stub 正確返回了 0 (成功)，EntryPoint 隨後呼叫了 SCW.execute。流程已打通！'
        );
        setStatusMessage('✅ PoC 2.5 Success (Pipeline OK)');
        setStatusType('success');
      } else if (payload?.error) {
        addLog(`[PoC 2.5] FAILED (as expected?): Bundler 回報交易失敗或 Reverted。`);
        addLog(`[PoC 2.5] (INFO) 如果我們的 validateUserOp stub *故意* revert，這也是一個成功！`);
        setStatusMessage('✅ PoC 2.5 Success (Revert Expected)');
        setStatusType('success');
      } else {
        throw new Error(payload?.message || '來自 Bundler 的未知錯誤');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`[PoC 2.4/2.5] FAILED: ${msg}`);
      setStatusMessage('❌ PoC 2 Failed');
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'loading':
        return 'text-blue-600';
      case 'idle':
      default:
        return 'text-gray-800';
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 antialiased sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            [PoC 3a] Real Signature Test
          </h1>
          <p className="mt-2 text-lg text-gray-600">Verify FIDO2 Signature On-Chain</p>
        </div>

        <div className="flex flex-col items-center rounded-xl bg-white p-8 shadow-lg">
          <div className="flex w-full flex-col gap-4">
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full rounded-lg bg-purple-600 px-6 py-4 font-semibold text-white shadow-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              1. Register New Passkey (Get Public Key)
            </button>

            <button
              onClick={handleTestBundler}
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? 'Processing...' : 'Run PoC 2.4 + 2.5 (Test Bundler)'}
            </button>

            {/* Info: (20251120 - Tzuhan) 新增按鈕: 檢查現有鑰匙 */}
            <button
              onClick={handleLoginCheck}
              disabled={isLoading}
              className="w-full rounded-lg bg-gray-600 px-6 py-2 text-sm font-medium text-white shadow hover:bg-gray-700 disabled:bg-gray-400"
            >
              (Optional) Check Existing Passkey
            </button>

            <div className="my-2 border-b border-gray-200"></div>

            <button
              onClick={handleRealSignatureTest}
              disabled={isLoading}
              className="w-full rounded-lg bg-green-600 px-6 py-4 font-semibold text-white shadow-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              2. Send Real Transaction (Use Registered Key)
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-3 border-b pb-2 text-lg font-semibold text-gray-700">
            Verification Status
          </h2>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500">Status:</p>
            <p className={`text-lg font-bold ${getStatusColor(statusType)}`}>{statusMessage}</p>
          </div>

          {xyCoords && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <h2 className="font-bold text-green-700">
                ✅ [PoC 1-2] 成功提取 P-256 座標 (Happy Path)
              </h2>
              <p className="mt-2 break-all text-xs">
                <strong>X (base64url):</strong> {xyCoords.x}
              </p>
              <p className="mt-1 break-all text-xs">
                <strong>Y (base64url):</strong> {xyCoords.y}
              </p>

              <hr className="my-3 border-green-300" />
              <h3 className="mb-2 font-bold text-green-700">👇 請複製到 .env (Deploy config)</h3>
              <div className="space-y-2 overflow-x-auto rounded bg-slate-100 p-2">
                <p className="break-all font-mono text-xs text-slate-600">
                  SCW_OWNER_PUBLIC_KEY_X=&quot;{toBigInt(xyCoords.x)}&quot;
                </p>
                <p className="break-all font-mono text-xs text-slate-600">
                  SCW_OWNER_PUBLIC_KEY_Y=&quot;{toBigInt(xyCoords.y)}&quot;
                </p>
              </div>
            </div>
          )}

          {challengeBase64 && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h2 className="font-bold text-blue-700">
                ✅ [PoC 2-3] Challenge for UserOpHash (Base64URL):
              </h2>
              <p className="mt-2 break-all text-xs">{challengeBase64}</p>
            </div>
          )}

          <h3 className="mt-4 text-sm font-medium text-gray-500">Logs:</h3>
          <pre
            style={{
              backgroundColor: '#f4f4f4',
              border: '1px solid #ccc',
              padding: '10px',
              maxHeight: '400px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {logs.length > 0 ? logs.join('\n') : 'Logs will appear here...'}
          </pre>
        </div>
      </div>
    </main>
  );
}
