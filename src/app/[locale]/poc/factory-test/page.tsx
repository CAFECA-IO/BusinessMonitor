'use client';

import { useState } from 'react';
import { fido2ClientService } from '@/lib/fido2-client';
import { bufferToBase64Url, parsePublicKeyCoordinates } from '@/lib/fido2-parse';
import { packWebAuthnSignature } from '@/lib/webauthn-utils';
import { getInitCode, factoryAbi } from '@/lib/aa-utils';
import { UserOperation, UserOperationJson, BundlerResponse } from '@/validators';
import { createPublicClient, http, parseAbi, type Hex, type Address } from 'viem';
import { RPC_URL } from '@/constants/config';

// Info: (20251126 - Tzuhan) 環境變數讀取
const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_SCW_FACTORY_ADDRESS || '') as Address;
const ENTRY_POINT_ADDRESS = (process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS || '') as Address;

const entryPointAbi = parseAbi([
  'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)',
  'function getUserOpHash((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp) external view returns (bytes32)',
]);
type StatusType = 'idle' | 'loading' | 'success' | 'error';

// Info: (20251125 - Tzuhan) 輔助：Base64URL -> BigInt
const toBigInt = (base64Url: string) => {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(base64);
  let hex = '0x';
  for (let i = 0; i < bin.length; i++) hex += bin.charCodeAt(i).toString(16).padStart(2, '0');
  return BigInt(hex);
};

export default function FactoryTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [statusType, setStatusType] = useState<StatusType>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [pubKey, setPubKey] = useState<{ x: bigint; y: bigint } | null>(null);
  const [scwAddress, setScwAddress] = useState<Address | null>(null);
  const [isDeployed, setIsDeployed] = useState<boolean>(false);

  const addLog = (log: string) =>
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);

  // Info: (20251125 - Tzuhan) --- 步驟 1: 註冊 Passkey (取得公鑰) ---
  const handleRegister = async () => {
    setIsLoading(true);
    setLogs([]);
    try {
      addLog('[1] Fetching registration options...');
      const response = await fetch('/api/v1/secure/webauthn-options?intent=register');
      const { payload: options } = await response.json();

      addLog('[1] Creating Passkey...');
      const credential = await fido2ClientService.startRegistration(options);

      const coords = parsePublicKeyCoordinates(credential.response.attestationObject);
      if (!coords) throw new Error('Failed to parse coordinates');

      const x = toBigInt(coords.x);
      const y = toBigInt(coords.y);
      setPubKey({ x, y });
      addLog(`[1] Passkey Created! X=${x}, Y=${y}`);

      // Info: (20251125 - Tzuhan) 註冊完直接計算地址
      await calculateAddress(x, y);
    } catch (e: unknown) {
      addLog(`❌ Error: ${(e as Error).message}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Info: (20251126 - Tzuhan) --- 步驟 2: 計算 Counterfactual Address (預測地址) ---
  const calculateAddress = async (x: bigint, y: bigint) => {
    if (!FACTORY_ADDRESS) return addLog('❌ Factory Address not set in .env');

    try {
      const client = createPublicClient({ transport: http(RPC_URL) });
      const salt = BigInt(0); // Info: (20251126 - Tzuhan) 為了測試方便，固定 Salt 為 0

      addLog('[2] Calculating deterministic address via Factory...');
      const address = await client.readContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: 'getAddress',
        args: [x, y, salt],
      });

      setScwAddress(address);
      addLog(`[2] 預測錢包地址: ${address}`);

      // Info: (20251126 - Tzuhan) 檢查鏈上是否已部署
      const code = await client.getCode({ address });
      const deployed = code !== undefined && code !== '0x';
      setIsDeployed(deployed);
      addLog(`[2] 鏈上狀態: ${deployed ? '✅ 已部署 (Deployed)' : '🆕 未部署 (Fresh)'}`);
    } catch (e: unknown) {
      addLog(`❌ Error: ${(e as Error).message}`);
    }
  };

  // Info: (20251126 - Tzuhan) --- 步驟 3: 發送交易 (自動處理部署) ---
  const handleSendTx = async () => {
    if (!scwAddress || !pubKey) return addLog('❌ 請先註冊並計算地址');
    setIsLoading(true);
    setStatusType('loading');

    try {
      const client = createPublicClient({ transport: http(RPC_URL) });
      const salt = BigInt(0);

      // Info: (20251126 - Tzuhan) ★★★ Lazy Deployment 核心邏輯 ★★★
      // Info: (20251126 - Tzuhan) 如果合約未部署，initCode = Factory地址 + createAccount編碼
      // Info: (20251126 - Tzuhan) 如果合約已部署，initCode = 0x
      let initCode: Hex = '0x';
      if (!isDeployed) {
        addLog('[3] 偵測到新帳戶，準備 initCode 進行 Lazy Deployment...');
        if (!FACTORY_ADDRESS) throw new Error('Factory Address missing');
        initCode = getInitCode(FACTORY_ADDRESS, pubKey.x, pubKey.y, salt);
      } else {
        addLog('[3] 帳戶已存在，直接發送交易...');
      }

      // Info: (20251126 - Tzuhan) 1. 取得 Nonce (未部署時為 0)
      let nonce = BigInt(0);
      if (isDeployed) {
        nonce = await client.readContract({
          address: ENTRY_POINT_ADDRESS,
          abi: entryPointAbi,
          functionName: 'getNonce',
          args: [scwAddress, BigInt(0)],
        });
      }

      // Info: (20251126 - Tzuhan) 2. 建構 UserOp
      const userOp: UserOperation = {
        sender: scwAddress,
        nonce,
        initCode, // Info: (20251126 - Tzuhan) <--- 關鍵
        callData: '0x', // Info: (20251126 - Tzuhan) 空操作
        callGasLimit: BigInt(200_000), // Info: (20251126 - Tzuhan) 部署需要較多 Gas
        verificationGasLimit: isDeployed ? BigInt(500_000) : BigInt(3_500_000),
        preVerificationGas: BigInt(100_000),
        // Info: (20251126 - Tzuhan) 設定為 0，由 Relayer 全額買單，新用戶無需充值即可部署
        maxFeePerGas: BigInt(0),
        maxPriorityFeePerGas: BigInt(0),
        paymasterAndData: '0x',
        signature: '0x',
      };

      // Info: (20251126 - Tzuhan) 3. 取得 Hash 並簽名 (同 PoC 3a)
      const userOpTuple = {
        ...userOp,
        sender: scwAddress as `0x${string}`,
        initCode: initCode as `0x${string}`,
        callData: '0x' as `0x${string}`,
        paymasterAndData: '0x' as `0x${string}`,
        signature: '0x' as `0x${string}`,
      };
      const userOpHash = await client.readContract({
        address: ENTRY_POINT_ADDRESS,
        abi: entryPointAbi,
        functionName: 'getUserOpHash',
        args: [userOpTuple],
      });

      // Info: (20251126 - Tzuhan) 4. Passkey 簽名
      addLog(`[3] UserOpHash: ${userOpHash}`);
      const challengeBase64 = bufferToBase64Url(Buffer.from(userOpHash.slice(2), 'hex'));
      addLog('[3] challenge (Base64URL): ' + challengeBase64);

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: Buffer.from(userOpHash.slice(2), 'hex'),
          rpId: window.location.hostname,
          userVerification: 'required',
          allowCredentials: [],
        },
      })) as PublicKeyCredential;

      const response = assertion.response as AuthenticatorAssertionResponse;
      const packedSignature = packWebAuthnSignature(
        new Uint8Array(response.authenticatorData),
        new TextDecoder().decode(response.clientDataJSON),
        new Uint8Array(response.signature),
        pubKey.x,
        pubKey.y
      );

      // Info: (20251126 - Tzuhan) 5. 發送
      const userOpJson: UserOperationJson = {
        ...userOp,
        nonce: `0x${userOp.nonce.toString(16)}`,
        callGasLimit: `0x${userOp.callGasLimit.toString(16)}`,
        verificationGasLimit: `0x${userOp.verificationGasLimit.toString(16)}`,
        preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
        maxFeePerGas: `0x${userOp.maxFeePerGas.toString(16)}`,
        maxPriorityFeePerGas: `0x${userOp.maxPriorityFeePerGas.toString(16)}`,
        signature: packedSignature,
      };

      addLog('[3] Sending to Bundler...');
      const res = await fetch('/api/v1/bundler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userOp: userOpJson, entryPointAddress: ENTRY_POINT_ADDRESS }),
      });

      const result: BundlerResponse = await res.json();
      addLog(`[3] Response: ${JSON.stringify(result, null, 2)}`);

      if (result.payload?.transactionHash && result.payload?.status === 'success') {
        setStatusType('success');
        addLog('🎉🎉🎉 交易成功！合約應已自動部署！');
        setIsDeployed(true); // Info: (20251126 - Tzuhan) 更新狀態
      } else {
        throw new Error(result.payload?.error || 'Failed');
      }
    } catch (e: unknown) {
      addLog(`❌ Error: ${(e as Error).message}`);
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
      default:
        return 'text-gray-800';
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">[PoC 4] Lazy Deployment Demo</h1>
          <p className="mt-2 text-gray-600">Auto-deploy SCW on first transaction (Gasless)</p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl bg-white p-8 shadow-lg">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="rounded-lg bg-purple-600 px-4 py-3 font-bold text-white hover:bg-purple-700 disabled:bg-gray-400"
            >
              1. Register New Key
            </button>
            <button
              onClick={() => pubKey && calculateAddress(pubKey.x, pubKey.y)}
              disabled={isLoading || !pubKey}
              className="rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              2. Check Address
            </button>
            <button
              onClick={handleSendTx}
              disabled={isLoading || !scwAddress}
              className="rounded-lg bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              3. {isDeployed ? 'Send Tx' : 'Deploy & Send'}
            </button>
          </div>

          <div className="mt-4 border-t pt-4">
            {scwAddress && (
              <div className="mb-4 rounded bg-blue-50 p-3 text-sm">
                <p className="font-bold text-blue-800">Future Wallet Address:</p>
                <p className="break-all font-mono text-blue-600">{scwAddress}</p>
                <p className="mt-1 font-bold">
                  Status: {isDeployed ? '✅ On-Chain' : '⏳ Counterfactual (Not deployed)'}
                </p>
              </div>
            )}
            <pre
              className={`max-h-60 overflow-auto rounded bg-gray-100 p-4 text-xs ${getStatusColor(statusType)}`}
            >
              {logs.length > 0 ? logs.join('\n') : 'Logs will appear here...'}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
