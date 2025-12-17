'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaWallet,
  FaPaperPlane,
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { useAuth } from '@/contexts/auth_context';
import { IExtendedUser } from '@/interfaces/auth';
import { publicClient } from '@/lib/viem';
import { CONTRACT_ADDRESSES, ABIS } from '@/config/contracts';
import { packWebAuthnSignature } from '@/lib/webauthn-utils';
import { extractXYFromSPKI } from '@/lib/fido2-parse';
import { type Address } from 'viem';
import { UserOperationJson } from '@/validators';
import { routes } from '@/config/api_routes';
import { EXTERNAL_URL } from '@/constants/url';

export default function WalletClient() {
  const router = useRouter();
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
  const user = authUser as IExtendedUser | null;
  const [balance, setBalance] = useState<string>('0.00');
  const [toAddress, setToAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  // Info: (20251217 - Tzuhan) 新增 txHash 狀態
  const [txHash, setTxHash] = useState<string | null>(null);

  // Info: (20251217 - Tzuhan) 查詢餘額
  const fetchBalance = useCallback(async () => {
    if (!user?.blockchainAddress) return;
    try {
      const res = await fetch(routes.account.balance(user.blockchainAddress));
      const data = await res.json();
      if (data.success && data.payload) {
        // Info: (20251217 - Tzuhan) 格式化顯示小數點後 4 位
        const bal = parseFloat(data.payload.balance).toFixed(4);
        setBalance(bal);
      }
    } catch (err) {
      console.error('Failed to fetch balance', err);
    }
  }, [user?.blockchainAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Info: (20251217 - Tzuhan) 處理轉帳
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.blockchainAddress || !toAddress || !amount) return;

    setIsLoading(true);
    setError(null);
    setTxHash(null);
    setStatus('正在建構交易...');

    try {
      // Info: (20251217 - Tzuhan) 1. 呼叫 API 建構 UserOp
      const buildRes = await fetch(routes.account.transfer.build(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: user.blockchainAddress,
          to: toAddress,
          amount: amount,
        }),
      });

      const buildData = await buildRes.json();
      if (!buildData.success) throw new Error(buildData.message || '建構交易失敗');

      const userOp = buildData.payload.userOp;

      // Info: (20251217 - Tzuhan) 2. 計算 UserOp Hash (Challenge)
      setStatus('等待簽名...');
      const client = publicClient;

      // Info: (20251217 - Tzuhan) 轉換成 Tuple 供合約讀取
      const userOpTuple = {
        sender: userOp.sender as Address,
        nonce: BigInt(userOp.nonce),
        initCode: userOp.initCode as `0x${string}`,
        callData: userOp.callData as `0x${string}`,
        callGasLimit: BigInt(userOp.callGasLimit),
        verificationGasLimit: BigInt(userOp.verificationGasLimit),
        preVerificationGas: BigInt(userOp.preVerificationGas),
        maxFeePerGas: BigInt(userOp.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(userOp.maxPriorityFeePerGas),
        paymasterAndData: userOp.paymasterAndData as `0x${string}`,
        signature: '0x' as `0x${string}`,
      };

      if (!CONTRACT_ADDRESSES.ENTRY_POINT) throw new Error('EntryPoint address missing');

      const userOpHash = await client.readContract({
        address: CONTRACT_ADDRESSES.ENTRY_POINT,
        abi: ABIS.ENTRY_POINT,
        functionName: 'getUserOpHash',
        args: [userOpTuple],
      });

      // Info: (20251217 - Tzuhan) 3. 喚起 Passkey 簽名
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: Buffer.from(userOpHash.slice(2), 'hex'),
          rpId: window.location.hostname,
          userVerification: 'required',
          allowCredentials: [],
        },
      })) as PublicKeyCredential;

      const response = assertion.response as AuthenticatorAssertionResponse;

      // Info: (20251217 - Tzuhan) 4. 識別簽名裝置的公鑰 (用於合約驗證)
      let signerX = BigInt(0);
      let signerY = BigInt(0);

      const currentCredId = assertion.id;
      const currentAuth = user.authenticators?.find((a) => a.credentialID === currentCredId);

      if (currentAuth) {
        const keys = extractXYFromSPKI(currentAuth.credentialPublicKey);
        if (keys) {
          signerX = keys.x;
          signerY = keys.y;
        }
      } else {
        // Info: (20251217 - Tzuhan) Fallback: 使用初始公鑰
        const initKey = user.initPublicKey as { x: string; y: string };
        if (initKey) {
          signerX = BigInt(initKey.x);
          signerY = BigInt(initKey.y);
        }
      }

      if (signerX === BigInt(0)) throw new Error('無法識別簽名裝置');

      // Info: (20251217 - Tzuhan) 5. 打包簽名
      const packedSignature = packWebAuthnSignature(
        new Uint8Array(response.authenticatorData),
        new TextDecoder().decode(response.clientDataJSON),
        new Uint8Array(response.signature),
        signerX,
        signerY
      );

      // Info: (20251217 - Tzuhan) 6. 發送給 Bundler
      setStatus('正在發送交易...');

      const signedUserOpJson: UserOperationJson = {
        sender: userOp.sender,
        nonce: `0x${BigInt(userOp.nonce).toString(16)}`,
        initCode: userOp.initCode,
        callData: userOp.callData,
        callGasLimit: `0x${BigInt(userOp.callGasLimit).toString(16)}`,
        verificationGasLimit: `0x${BigInt(userOp.verificationGasLimit).toString(16)}`,
        preVerificationGas: `0x${BigInt(userOp.preVerificationGas).toString(16)}`,
        maxFeePerGas: `0x${BigInt(userOp.maxFeePerGas).toString(16)}`,
        maxPriorityFeePerGas: `0x${BigInt(userOp.maxPriorityFeePerGas).toString(16)}`,
        paymasterAndData: userOp.paymasterAndData,
        signature: packedSignature,
      };

      const bundleRes = await fetch('/api/v1/bundler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userOp: signedUserOpJson,
          entryPointAddress: CONTRACT_ADDRESSES.ENTRY_POINT,
        }),
      });

      const bundleResult = await bundleRes.json();

      if (bundleResult.success && bundleResult.payload?.status === 'success') {
        // Info: (20251217 - Tzuhan) 交易成功，設定 TxHash
        const hash = bundleResult.payload.transactionHash;
        setTxHash(hash);
        setStatus(`✅ 轉帳成功！`);
        setAmount('');
        setToAddress('');
        // Info: (20251217 - Tzuhan) 延遲一下再更新餘額，讓區塊鏈同步
        setTimeout(fetchBalance, 3000);
      } else {
        throw new Error(bundleResult.payload?.error || '交易失敗');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Error';
      setError(msg);
      setStatus('❌ 交易失敗');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-purple-600" size={30} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-white px-6 py-4 shadow-sm">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-xl font-bold text-gray-800">My Wallet</h1>
      </div>

      <div className="mx-auto max-w-md space-y-6 p-6">
        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white shadow-lg">
          <div className="absolute -right-4 -top-4 text-white/10">
            <FaWallet size={120} />
          </div>

          <div className="relative z-10">
            <p className="mb-1 text-sm font-medium text-purple-100">Total Balance</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold">{balance}</h2>
              <span className="text-lg font-medium">iSun</span>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-purple-200">Address</span>
                <span className="font-mono text-xs text-white/90">
                  {user.blockchainAddress
                    ? `${user.blockchainAddress.slice(0, 6)}...${user.blockchainAddress.slice(-4)}`
                    : 'Not Deployed'}
                </span>
              </div>
              <button
                onClick={fetchBalance}
                className="rounded-lg bg-white/20 px-3 py-1.5 text-xs backdrop-blur-sm hover:bg-white/30"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Transfer Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
            <FaPaperPlane className="text-purple-600" /> Transfer
          </h3>

          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label
                htmlFor="recipient-address"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Recipient Address
              </label>
              <input
                id="recipient-address"
                type="text"
                required
                placeholder="0x..."
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100"
                aria-label="Recipient Address"
              />
            </div>

            <div>
              <label
                htmlFor="amount-input"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Amount
              </label>
              <div className="relative">
                <input
                  id="amount-input"
                  type="number"
                  step="0.0001"
                  required
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pr-12 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100"
                  aria-label="Amount"
                />
                <span className="absolute right-3 top-3 text-sm font-bold text-gray-400">iSun</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !user.blockchainAddress}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-semibold text-white shadow-md transition hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              {isLoading ? 'Processing...' : 'Send Tokens'}
            </button>
          </form>

          {/* Status Message */}
          {status && status !== 'success' && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <p className="flex items-center gap-2 font-medium">
                <FaSpinner className="animate-spin" /> {status}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">Error: {error}</p>
            </div>
          )}

          {/* Info: (20251217 - Tzuhan) 交易成功顯示區塊 */}
          {txHash && (
            <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-green-700">
                <FaCheckCircle size={18} />
                <span className="font-bold">交易成功！(Transfer Sent)</span>
              </div>
              <p className="mb-2 break-all text-xs text-green-600">Hash: {txHash}</p>
              <a
                href={`${EXTERNAL_URL.BAIFA_EXPLORER}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-md border border-green-200 bg-white py-2 text-xs font-semibold text-green-700 shadow-sm transition hover:bg-green-50"
              >
                在區塊鏈瀏覽器查看 <FaExternalLinkAlt />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
