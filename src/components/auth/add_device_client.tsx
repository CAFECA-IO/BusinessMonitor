'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import { routes } from '@/config/api_routes';
import { getPusherInstance } from '@/lib/pusher_client';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import { packWebAuthnSignature } from '@/lib/webauthn-utils';
import { UserOperation, UserOperationJson } from '@/validators';
import {
  createPublicClient,
  http,
  parseAbi,
  encodeFunctionData,
  type Address,
  type Hex,
} from 'viem';
import { RPC_URL } from '@/constants/config';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

// Info: (20251202 - Tzuhan) 區塊鏈參數
const ENTRY_POINT_ADDRESS = (process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS || '') as Address;

// Info: (20251202 - Tzuhan) ABI
const scwAbi = parseAbi([
  'function addSigner(uint256 x, uint256 y) external',
  'function execute(address dest, uint256 value, bytes func) external',
]);

const entryPointAbi = parseAbi([
  'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)',
  'function getUserOpHash((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp) external view returns (bytes32)',
]);

interface ICandidateKey {
  pubKeyX: string;
  pubKeyY: string;
  deviceName?: string;
}

export default function AddDeviceClient() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('正在產生 QR Code...');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Info: (20251202 - Tzuhan) 新增：候選裝置資料 (從 Pusher 收到)
  const [candidate, setCandidate] = useState<ICandidateKey | null>(null);

  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const channelName = sessionId ? `private-login-session-${sessionId}` : null;

  // Info: (20251202 - Tzuhan) 核心：批准並發送 addSigner 交易
  const handleApproveDevice = useCallback(async () => {
    if (!sessionId || !candidate || !user?.blockchainAddress) {
      setError('缺少必要資訊 (Session, Candidate, or SCW Address)');
      return;
    }

    setIsLoading(true);
    setStatusMessage('正在準備區塊鏈交易...');
    setError(null);

    try {
      const client = createPublicClient({ transport: http(RPC_URL) });
      const scwAddress = user.blockchainAddress as Address;

      // Info: (20251202 - Tzuhan) 1. 準備 CallData: SCW.execute(SCW, 0, addSigner(B))
      const innerCallData = encodeFunctionData({
        abi: scwAbi,
        functionName: 'addSigner',
        args: [BigInt(candidate.pubKeyX), BigInt(candidate.pubKeyY)],
      });

      const userOpCallData = encodeFunctionData({
        abi: scwAbi,
        functionName: 'execute',
        args: [scwAddress, BigInt(0), innerCallData],
      });

      // Info: (20251202 - Tzuhan) 2. 取得 Nonce
      const nonce = await client.readContract({
        address: ENTRY_POINT_ADDRESS,
        abi: entryPointAbi,
        functionName: 'getNonce',
        args: [scwAddress, BigInt(0)],
      });

      // Info: (20251202 - Tzuhan) 3. 建構 UserOp
      const userOp: UserOperation = {
        sender: scwAddress,
        nonce,
        initCode: '0x', // Info: (20251202 - Tzuhan) 假設已部署 (能按 Add Device 代表已有帳號)
        callData: userOpCallData,
        callGasLimit: BigInt(100_000),
        verificationGasLimit: BigInt(500_000),
        preVerificationGas: BigInt(50_000),
        maxFeePerGas: BigInt(0),
        maxPriorityFeePerGas: BigInt(0),
        paymasterAndData: '0x',
        signature: '0x',
      };

      // Info: (20251202 - Tzuhan) 4. 計算 Hash
      // 確保型別正確轉型為 Hex
      const userOpTuple = {
        ...userOp,
        sender: userOp.sender as Address,
        initCode: userOp.initCode as Hex,
        callData: userOp.callData as Hex,
        paymasterAndData: userOp.paymasterAndData as Hex,
        signature: userOp.signature as Hex,
      };

      const userOpHash = await client.readContract({
        address: ENTRY_POINT_ADDRESS,
        abi: entryPointAbi,
        functionName: 'getUserOpHash',
        args: [userOpTuple],
      });

      // Info: (20251202 - Tzuhan) 5. 喚起本機 Passkey (Signer A) 簽名
      setStatusMessage(`請使用您的 Passkey 授權新增裝置：${candidate.deviceName || 'New Device'}`);

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: Buffer.from(userOpHash.slice(2), 'hex'),
          rpId: window.location.hostname,
          userVerification: 'required',
          allowCredentials: [],
        },
      })) as PublicKeyCredential;

      const response = assertion.response as AuthenticatorAssertionResponse;

      // Info: (20251202 - Tzuhan) 需要當前使用者的 initPublicKey 來打包簽名
      // Info: (20251202 - Tzuhan) (假設 user.initPublicKey 是 {x, y} 格式)
      // 注意：這裡假設 A 是用 initKey 簽名。如果是多裝置情境，理想上應該讓用戶選鑰匙或從 LocalStorage 讀取
      const ownerKey = user.initPublicKey as { x: string; y: string } | null;
      if (!ownerKey?.x || !ownerKey?.y) throw new Error('無法取得您的公鑰資訊');

      const packedSignature = packWebAuthnSignature(
        new Uint8Array(response.authenticatorData),
        new TextDecoder().decode(response.clientDataJSON),
        new Uint8Array(response.signature),
        BigInt(ownerKey.x),
        BigInt(ownerKey.y)
      );

      // Info: (20251202 - Tzuhan) 6. 發送給 Bundler
      setStatusMessage('正在提交鏈上授權...');
      const signedUserOpJson: UserOperationJson = {
        ...userOp,
        nonce: `0x${userOp.nonce.toString(16)}`,
        callGasLimit: `0x${userOp.callGasLimit.toString(16)}`,
        verificationGasLimit: `0x${userOp.verificationGasLimit.toString(16)}`,
        preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
        maxFeePerGas: `0x${userOp.maxFeePerGas.toString(16)}`,
        maxPriorityFeePerGas: `0x${userOp.maxPriorityFeePerGas.toString(16)}`,
        signature: packedSignature,
      };

      // Info: (20251202 - Tzuhan) 7. 交易成功，通知後端同步狀態 (這會觸發 Device B 跳轉)
      setStatusMessage('✅ 鏈上授權成功！正在同步資料...');

      const dewt = localStorage.getItem('dewt');
      // Info: (20251202 - Tzuhan) 這裡複用 authorize 接口，但可以帶入額外資訊告知後端這是 PoC 4 流程
      // Info: (20251202 - Tzuhan) 或者後端 pairing/authorize 需要升級來發送 'device-added-success'
      const authRes = await fetch(`${origin}${routes.pairing.authorize()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dewt}` },
        body: JSON.stringify({
          sessionId,
          action: 'confirm_add_device',
          userOp: signedUserOpJson, // Info: (20251204 - Tzuhan) 傳送簽名後的 UserOp
          entryPointAddress: ENTRY_POINT_ADDRESS,
        }),
      });

      const authResult = await authRes.json();

      if (!authRes.ok || !authResult.success) {
        throw new Error(authResult.message || '授權失敗');
      }

      alert(`成功新增裝置！交易 Hash: ${authResult.payload.transactionHash?.slice(0, 10)}...`);
      setCandidate(null);
      router.push(BM_URL.PROFILE);
    } catch (err: unknown) {
      setError((err as Error).message || '批准失敗');
      setStatusMessage('錯誤');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, candidate, user, router]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      setError('您必須先登入才能新增裝置。');
      setStatusMessage('錯誤：未授權');
      setIsLoading(false);
      setTimeout(() => router.push(BM_URL.LOGIN), 3000);
      return;
    }

    const initializeQrSession = async () => {
      try {
        const dewt = localStorage.getItem('dewt');
        const res = await fetch(`${origin}${routes.pairing.initiate()}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${dewt}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        const { sessionId, challenge } = data.payload;
        setSessionId(sessionId);

        // Info: (20251202 - Tzuhan) 產生 Setup URL (給 Device B 掃的)
        const setupUrl = new URL(`${origin}${BM_URL.SETUP_NEW_DEVICE}`);
        setupUrl.searchParams.set('sessionId', sessionId);
        setupUrl.searchParams.set('challenge', challenge);

        const dataUrl = await QRCode.toDataURL(setupUrl.toString(), { width: 256, margin: 2 });
        setQrCodeDataUrl(dataUrl);
        setStatusMessage('請使用您的新裝置掃描此 QR Code。');
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeQrSession();
  }, [router, isAuthLoading, user]);

  // Info: (20251202 - Tzuhan) Pusher 監聽邏輯
  useEffect(() => {
    if (!channelName) return;

    const pusherClient = getPusherInstance();
    const channel = pusherClient.subscribe(channelName);

    // Info: (20251202 - Tzuhan) 監聽候選裝置公鑰
    channel.bind('client-candidate-ready', (data: ICandidateKey) => {
      console.log('Received candidate key:', data);
      setCandidate(data);
      setStatusMessage(`新裝置請求加入：${data.deviceName || 'Unknown Device'}`);
      setIsLoading(false); // Info: (20251202 - Tzuhan) 解除 Loading 讓按鈕可按
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [channelName]);

  if (isAuthLoading) {
    return <div className="flex grow items-center justify-center">正在驗證您的登入狀態...</div>;
  }

  return (
    <div className="flex grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">新增一個裝置</h1>
        <p className="mt-4 text-gray-600">{statusMessage}</p>

        <div className="flex size-full w-full flex-col items-center justify-center self-center rounded-lg p-2">
          {isLoading && !qrCodeDataUrl && <div className="animate-pulse">Loading...</div>}
          {error && <p className="text-red-500">{error}</p>}

          {/* Info: (20251202 - Tzuhan) 顯示 QR Code */}
          {qrCodeDataUrl && !candidate && (
            <div className="flex flex-col items-center">
              <Image
                src={qrCodeDataUrl}
                alt="Add device QR Code"
                width={256}
                height={256}
                style={{ objectFit: 'contain' }}
                unoptimized
              />
              {/* Info: (20251202 - Tzuhan) [Debug Info] 顯示 Session ID */}
              <p className="mt-2 font-mono text-xs text-gray-400">Session ID: {sessionId}</p>
            </div>
          )}

          {/* Info: (20251202 - Tzuhan) 顯示候選裝置資訊 */}
          {candidate && (
            <div className="mt-4 w-full rounded border border-gray-200 bg-gray-50 p-4 text-left">
              <p className="text-center text-xl font-semibold text-green-600">✔️ 裝置已連線</p>
              <p className="text-center text-sm font-bold text-gray-700">
                {candidate.deviceName || 'Unknown Device'}
              </p>

              <div className="mt-4 border-t border-gray-200 pt-2">
                <p className="mb-1 text-xs font-bold text-gray-500">📋 Debug Info:</p>
                <div className="space-y-1 break-all font-mono text-[10px] text-gray-600">
                  <p>
                    <span className="font-semibold text-blue-600">X:</span> {candidate.pubKeyX}
                  </p>
                  <p>
                    <span className="font-semibold text-blue-600">Y:</span> {candidate.pubKeyY}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-500">Session:</span> {sessionId}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {candidate && (
          <button
            onClick={handleApproveDevice}
            disabled={isLoading}
            className="mt-6 w-full rounded-lg bg-purple-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-purple-700 disabled:bg-gray-400"
          >
            {isLoading ? '簽署交易中...' : '批准並簽署 (On-Chain)'}
          </button>
        )}

        <Link href={BM_URL.PROFILE} className="mt-8 inline-block text-purple-600 hover:underline">
          返回裝置管理
        </Link>
      </div>
    </div>
  );
}
