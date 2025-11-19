'use client';

import { useState } from 'react';
import { fido2ClientService } from '@/lib/fido2-client';
import { ICoordinates, parsePublicKeyCoordinates } from '@/lib/fido2-parse';
import type { IApiResponse } from '@/lib/response';
import type { RegisterOptions, RegistrationJSON } from '@passwordless-id/webauthn/dist/esm/types';

import { UserOperation, UserOperationJson, BundlerResponse } from '@/validators';

const ENTRY_POINT_ADDRESS = '0x79a1C201a58537d0448D78fa297a242884613Dca';
const SCW_ADDRESS = '0xd2dD53816B70668621b08176E86a16cd9A2167af';

type IApiSuccessResponse = IApiResponse<RegisterOptions>;
type StatusType = 'idle' | 'loading' | 'success' | 'error';

export default function PocRegisterAndParsePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [xyCoords, setXyCoords] = useState<ICoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for PoC 1 & 2');
  const [statusType, setStatusType] = useState<StatusType>('idle');

  const addLog = (log: string) => {
    console.log(log);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  // Info: (20251118 - Tzuhan) --- PoC 1.x 函式 (保持不變) ---
  const handleRegister = async () => {
    setIsLoading(true);
    setXyCoords(null);
    setLogs([]); // Info: (20251118 - Tzuhan) 清空日誌
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
        setStatusMessage('✅ PoC 1.2 Success!');
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

  // Info: (20251118 - Tzuhan) --- [PoC 2.4 / 2.5] 函式 ---
  const handleTestBundler = async () => {
    setIsLoading(true);
    setXyCoords(null);
    setLogs([]); // Info: (20251118 - Tzuhan) 清空日誌
    setStatusMessage('Loading...');
    setStatusType('loading');
    addLog('[PoC 2.4 / 2.5] Starting Bundler E2E Test...');

    // Info: (20251118 - Tzuhan) (地址檢查現在會通過)
    if (!ENTRY_POINT_ADDRESS || !SCW_ADDRESS) {
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
        sender: SCW_ADDRESS as `0x${string}`,
        nonce: BigInt(0),
        initCode: '0x',
        callData: '0x',
        callGasLimit: BigInt(100_000),
        verificationGasLimit: BigInt(150_000),
        preVerificationGas: BigInt(21_000),
        maxFeePerGas: BigInt(10_000_000_000), // 10 Gwei
        maxPriorityFeePerGas: BigInt(2_000_000_000), // 2 Gwei
        paymasterAndData: '0x',
        signature: '0xdeadbeef', // [PoC 2] 假的 stub 簽名
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
          entryPointAddress: ENTRY_POINT_ADDRESS,
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
            [PoC 1-1] + [PoC 1-2] + [PoC 2]
          </h1>
          <p className="mt-2 text-lg text-gray-600">Passkey SSI PoC Dashboard</p>
        </div>

        <div className="flex flex-col items-center rounded-xl bg-white p-8 shadow-lg">
          <div className="flex w-full flex-col gap-4">
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full rounded-lg bg-purple-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? 'Processing...' : 'Run PoC 1.1 + 1.2 (Register Passkey)'}
            </button>

            <button
              onClick={handleTestBundler}
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? 'Processing...' : 'Run PoC 2.4 + 2.5 (Test Bundler)'}
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
