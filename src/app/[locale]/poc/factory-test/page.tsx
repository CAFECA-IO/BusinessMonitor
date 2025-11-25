'use client';

import { useState } from 'react';
import { fido2ClientService } from '@/lib/fido2-client';
import { parsePublicKeyCoordinates } from '@/lib/fido2-parse';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [logs, setLogs] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [statusType, setStatusType] = useState<StatusType>('idle');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pubKey, setPubKey] = useState<{ x: bigint; y: bigint } | null>(null);

  const addLog = (log: string) =>
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);

  // Info: (20251125 - Tzuhan) --- 步驟 1: 註冊 Passkey (取得公鑰) ---
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRegister = async () => {
    try {
      // Info: (20251125 - Tzuhan) A. 取得挑戰碼 (Challenge)
      const response = await fetch('/api/v1/secure/webauthn-options?intent=register');
      const { payload: options } = await response.json();

      // Info: (20251125 - Tzuhan) B. 喚起生物辨識
      const credential = await fido2ClientService.startRegistration(options);

      // Info: (20251125 - Tzuhan) C. 解析公鑰座標
      const coords = parsePublicKeyCoordinates(credential.response.attestationObject);
      if (!coords) throw new Error('Failed to parse coordinates');
      const x = toBigInt(coords.x);
      const y = toBigInt(coords.y);

      setPubKey({ x, y }); // Info: (20251125 - Tzuhan) 存起來給下一步用
      addLog(`[1] Passkey 建立成功! X=${x}, Y=${y}`);
    } catch (e) {
      addLog(`❌ Error: ${(e as Error).message}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">[PoC 4] Lazy Deployment Demo</h1>
          <p className="mt-2 text-gray-600">Auto-deploy SCW on first transaction (Gasless)</p>
        </div>
      </div>
    </main>
  );
}
