'use client';

import { useState } from 'react';
import { fido2ClientService } from '@/lib/fido2-client';
import { bufferToBase64Url, parsePublicKeyCoordinates } from '@/lib/fido2-parse';
import { packWebAuthnSignature } from '@/lib/webauthn-utils';
import { UserOperation, UserOperationJson, BundlerResponse } from '@/validators';
import { encodeFunctionData, type Hex } from 'viem';
import { publicClient } from '@/lib/viem';
import { CONTRACT_ADDRESSES, ABIS } from '@/config/contracts';
import { toBigInt } from '@/lib/common';

export default function MultiSignerPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Info: (20251127 - Tzuhan) 新鑰匙 (Signer B) 的資料
  const [newSigner, setNewSigner] = useState<{ x: bigint; y: bigint } | null>(null);

  const addLog = (log: string) =>
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);

  // Info: (20251127 - Tzuhan) 1. 產生新鑰匙 (模擬在第二台裝置上操作)
  const handleCreateNewKey = async () => {
    setIsLoading(true);
    setLogs([]);
    try {
      addLog('[1] Creating NEW Passkey (Signer B)...');
      const response = await fetch('/api/v1/secure/webauthn-options?intent=register');
      const { payload: options } = await response.json();

      const credential = await fido2ClientService.startRegistration(options);
      const coords = parsePublicKeyCoordinates(credential.response.attestationObject);
      if (!coords) throw new Error('Failed to parse coordinates');

      const x = toBigInt(coords.x);
      const y = toBigInt(coords.y);
      setNewSigner({ x, y });
      addLog(`[1] New Key Generated!`);
      addLog(`X: ${x}`);
      addLog(`Y: ${y}`);
    } catch (e: unknown) {
      addLog(`❌ Error: ${(e as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Info: (20251127 - Tzuhan) 2. 授權新鑰匙 (Signer A 簽名)
  const handleAddSigner = async () => {
    if (!newSigner || !CONTRACT_ADDRESSES.SCW) return addLog('❌ Missing setup');
    setIsLoading(true);
    try {
      addLog('[2] Authorizing New Signer (Add)...');

      const innerCallData = encodeFunctionData({
        abi: ABIS.SCW,
        functionName: 'addSigner',
        args: [newSigner.x, newSigner.y],
      });

      const userOpCallData = encodeFunctionData({
        abi: ABIS.SCW,
        functionName: 'execute',
        args: [CONTRACT_ADDRESSES.SCW, BigInt(0), innerCallData],
      });

      /**
       * Info: (20251127 - Tzuhan) B. 發送交易
       * 注意：這裡我們假設目前 .env 裡設定的 SCW_OWNER_PUBLIC_KEY 就是 Signer A
       * 所以打包簽名時，我們會用到 .env 裡的公鑰 (這需要在 packWebAuthnSignature 時傳入)
       * 但前端無法直接讀取 .env 裡的 BigInt，所以我們用一個臨時變數或假設用戶知道
       */

      /**
       * Info: (20251127 - Tzuhan)
       * [Hack] 為了 Demo 方便，我們從 .env 讀取 Signer A 的公鑰字串並轉回 BigInt
       * 在正式版中，這應該由 AuthContext 管理
       */
      const signerAX = BigInt(process.env.NEXT_PUBLIC_SCW_OWNER_PUBLIC_KEY_X || '0');
      const signerAY = BigInt(process.env.NEXT_PUBLIC_SCW_OWNER_PUBLIC_KEY_Y || '0');

      if (signerAX === BigInt(0)) return addLog('❌ Env SCW_OWNER_PUBLIC_KEY not set');

      await sendUserOp(userOpCallData, { x: signerAX, y: signerAY }, 'Signer A (Original)');
      addLog('[2] 🎉 Add Signer Transaction Sent!');
    } catch (e: unknown) {
      addLog(`❌ Error: ${(e as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Info: (20251127 - Tzuhan) 3. 測試新鑰匙 (用新鑰匙 Signer B 簽名)
  const handleTestNewSigner = async () => {
    if (!newSigner) return addLog('❌ 請先產生新鑰匙');
    setIsLoading(true);
    try {
      addLog('[3] Testing New Signer (Signer B)...');
      // Info: (20251127 - Tzuhan) 發送一個空交易，證明 B 能控制帳戶
      const userOpCallData = encodeFunctionData({
        abi: ABIS.SCW,
        functionName: 'execute',
        args: [CONTRACT_ADDRESSES.SCW, BigInt(0), '0x'],
      });

      await sendUserOp(userOpCallData, newSigner, 'Signer B (New)');
      addLog('[3] 🎉 Signer B works! Verified.');
    } catch (e: unknown) {
      addLog(`❌ Error: ${(e as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Info: (20251127 - Tzuhan) 4. 移除新鑰匙 (Signer A 簽名)
  const handleRemoveSigner = async () => {
    if (!newSigner || !CONTRACT_ADDRESSES.SCW) return addLog('❌ Missing setup');
    setIsLoading(true);
    try {
      addLog('[4] Revoking Signer B (Remove)...');

      const innerCallData = encodeFunctionData({
        abi: ABIS.SCW,
        functionName: 'removeSigner',
        args: [newSigner.x, newSigner.y],
      });

      const userOpCallData = encodeFunctionData({
        abi: ABIS.SCW,
        functionName: 'execute',
        args: [CONTRACT_ADDRESSES.SCW, BigInt(0), innerCallData],
      });

      const signerAX = BigInt(process.env.NEXT_PUBLIC_SCW_OWNER_PUBLIC_KEY_X || '0');
      const signerAY = BigInt(process.env.NEXT_PUBLIC_SCW_OWNER_PUBLIC_KEY_Y || '0');

      // Info: (20251127 - Tzuhan) 使用 Signer A (Admin) 來移除 B
      await sendUserOp(userOpCallData, { x: signerAX, y: signerAY }, 'Signer A (Original)');
      addLog('[4] 🎉 Remove Signer Transaction Sent!');
    } catch (e: unknown) {
      addLog(`❌ Error: ${(e as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  //Info: (20251127 - Tzuhan) 5. 驗證移除 (Signer B 簽名 -> 應失敗)
  const handleVerifyRemoval = async () => {
    if (!newSigner) return addLog('❌ 請先產生新鑰匙');
    setIsLoading(true);
    try {
      addLog('[5] Testing Signer B again (Should Fail)...');
      const userOpCallData = encodeFunctionData({
        abi: ABIS.SCW,
        functionName: 'execute',
        args: [CONTRACT_ADDRESSES.SCW, BigInt(0), '0x'],
      });

      // Info: (20251127 - Tzuhan) 嘗試用已移除的 B 簽名
      await sendUserOp(userOpCallData, newSigner, 'Signer B (Revoked)');

      // Info: (20251127 - Tzuhan) 如果這裡成功了，代表移除失敗 (Bug)
      addLog('❌ [Unexpected] Signer B still works!');
    } catch (e: unknown) {
      // Info: (20251127 - Tzuhan) 如果報錯包含 AA24，代表驗證失敗，符合預期
      if ((e as Error).message.includes('AA24') || (e as Error).message.includes('reverted')) {
        addLog('[5] ✅ Expected Failure: Signer B is revoked (AA24/Revert).');
      } else {
        addLog(`❌ Error: ${(e as Error).message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Info: (20251127 - Tzuhan) 通用發送函式
  const sendUserOp = async (
    callData: Hex,
    signerPubKey: { x: bigint; y: bigint },
    signerName: string
  ) => {
    const client = publicClient;

    // Info: (20251127 - Tzuhan) 1. Get Nonce
    const nonce = await client.readContract({
      address: CONTRACT_ADDRESSES.ENTRY_POINT,
      abi: ABIS.ENTRY_POINT,
      functionName: 'getNonce',
      args: [CONTRACT_ADDRESSES.SCW, BigInt(0)],
    });

    const userOp: UserOperation = {
      sender: CONTRACT_ADDRESSES.SCW,
      nonce,
      initCode: '0x', // Info: (20251127 - Tzuhan) 假設已部署
      callData,
      callGasLimit: BigInt(100_000),
      verificationGasLimit: BigInt(500_000),
      preVerificationGas: BigInt(50_000),
      maxFeePerGas: BigInt(0),
      maxPriorityFeePerGas: BigInt(0),
      paymasterAndData: '0x',
      signature: '0x',
    };

    // Info: (20251127 - Tzuhan) 3. Hash
    const userOpHash = await client.readContract({
      address: CONTRACT_ADDRESSES.ENTRY_POINT,
      abi: ABIS.ENTRY_POINT,
      functionName: 'getUserOpHash',
      args: [
        {
          sender: CONTRACT_ADDRESSES.SCW as `0x${string}`,
          nonce,
          initCode: '0x' as `0x${string}`,
          callData: callData as `0x${string}`,
          callGasLimit: BigInt(100_000),
          verificationGasLimit: BigInt(500_000),
          preVerificationGas: BigInt(50_000),
          maxFeePerGas: BigInt(0),
          maxPriorityFeePerGas: BigInt(0),
          paymasterAndData: '0x' as `0x${string}`,
          signature: '0x' as `0x${string}`,
        },
      ],
    });

    // Info: (20251127 - Tzuhan) 4. Sign
    addLog(`[${signerName}] UserOpHash: ${userOpHash}`);

    addLog(`[${signerName}] Please sign transaction...`);
    const challengeBase64 = bufferToBase64Url(Buffer.from(userOpHash.slice(2), 'hex'));
    addLog(`[${signerName}] Challenge (Base64URL): ${challengeBase64}`);

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: Buffer.from(userOpHash.slice(2), 'hex'),
        rpId: window.location.hostname,
        userVerification: 'required',
        allowCredentials: [], // Info: (20251127 - Tzuhan) 讓用戶選擇要用哪把鑰匙 (A 或 B)
      },
    })) as PublicKeyCredential;

    const response = assertion.response as AuthenticatorAssertionResponse;

    // Info: (20251127 - Tzuhan) 5. Pack Signature (包含公鑰！)
    const packedSignature = packWebAuthnSignature(
      new Uint8Array(response.authenticatorData),
      new TextDecoder().decode(response.clientDataJSON),
      new Uint8Array(response.signature),
      signerPubKey.x, // Info: (20251127 - Tzuhan) 傳入當前簽名者的公鑰
      signerPubKey.y
    );

    // Info: (20251127 - Tzuhan) 6. Send
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

    addLog(`[${signerName}] Sending...`);
    const res = await fetch('/api/v1/bundler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userOp: signedUserOpJson,
        entryPointAddress: CONTRACT_ADDRESSES.ENTRY_POINT,
      }),
    });
    const result: BundlerResponse = await res.json();

    if (result.payload?.transactionHash && result.payload?.status === 'success') {
      addLog(`[${signerName}] Success! Tx: ${result.payload.transactionHash}`);
    } else {
      // Info: (20251127 - Tzuhan) 拋出包含詳細錯誤訊息的 Error
      const details = result.payload?.details || result.message || 'Tx Failed';
      throw new Error(`${details}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">[PoC 4] Multi-Signer Lifecycle</h1>
        </div>

        <div className="flex flex-col gap-4 rounded-xl bg-white p-8 shadow-lg">
          {/* Info: (20251127 - Tzuhan) Step 1 */}
          <div className="border-b pb-4">
            <h3 className="mb-2 text-lg font-bold">Step 1: Generate New Key</h3>
            <button
              onClick={handleCreateNewKey}
              disabled={isLoading}
              className="w-full rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-400"
            >
              Generate Signer B
            </button>
            {newSigner && <p className="mt-1 text-xs text-green-600">Ready</p>}
          </div>

          {/* Info: (20251127 - Tzuhan) Step 2 */}
          <div className="border-b pb-4">
            <h3 className="mb-2 text-lg font-bold">Step 2: Add Signer B</h3>
            <p className="mb-2 text-xs text-gray-500">Requires Signer A (Owner) signature</p>
            <button
              onClick={handleAddSigner}
              disabled={isLoading || !newSigner}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              Submit AddSigner Tx
            </button>
          </div>

          {/* Info: (20251127 - Tzuhan) Step 3 */}
          <div className="border-b pb-4">
            <h3 className="mb-2 text-lg font-bold">Step 3: Verify Signer B</h3>
            <p className="mb-2 text-xs text-gray-500">Use Signer B to send a tx</p>
            <button
              onClick={handleTestNewSigner}
              disabled={isLoading || !newSigner}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              Send Tx with Signer B
            </button>
          </div>

          {/* Info: (20251127 - Tzuhan) Step 4 */}
          <div className="border-b pb-4">
            <h3 className="mb-2 text-lg font-bold">Step 4: Remove Signer B</h3>
            <p className="mb-2 text-xs text-gray-500">Use Signer A (Owner) to revoke B</p>
            <button
              onClick={handleRemoveSigner}
              disabled={isLoading || !newSigner}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-gray-400"
            >
              Submit RemoveSigner Tx
            </button>
          </div>

          {/* Info: (20251127 - Tzuhan) Step 5 */}
          <div className="pb-4">
            <h3 className="mb-2 text-lg font-bold">Step 5: Verify Removal</h3>
            <p className="mb-2 text-xs text-gray-500">Try sending tx with B (Should Fail)</p>
            <button
              onClick={handleVerifyRemoval}
              disabled={isLoading || !newSigner}
              className="w-full rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:bg-gray-400"
            >
              Test Signer B Again
            </button>
          </div>

          <div className="mt-4 h-60 overflow-auto rounded bg-gray-100 p-4 font-mono text-xs">
            {logs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
