'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

const StatusDisplay = ({ status, error }: { status: string; error: string | null }) => (
  <div className="mt-8 w-full rounded-lg bg-gray-100 p-4">
    <h2 className="text-lg font-semibold text-gray-800">處理狀態</h2>
    <p className="mt-2 text-gray-700">
      狀態: <span className="font-medium">{status}</span>
    </p>
    {error && <p className="mt-2 text-red-600">錯誤: {error}</p>}
  </div>
);

export default function SignupClient() {
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('請輸入您的資訊以建立 Digital ID。');
  const [error, setError] = useState<string | null>(null);
  const [isFidoAvailable, setIsFidoAvailable] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!fido2ClientService.isAvailable()) {
      setIsFidoAvailable(false);
      setStatusMessage('此環境不支援 Passkey 功能。');
      setError('請使用支援的瀏覽器並確保在安全的 HTTPS 環境下操作。');
    }
  }, []);

  const handleRegister = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setStatusMessage('正在準備註冊...');

    try {
      // 步驟 1: 從後端獲取註冊選項
      const optionsRes = await fetch(`${origin}${routes.auth.webauthn.options('register')}`);
      if (!optionsRes.ok) throw new Error('無法從伺服器獲取註冊選項。');
      const options = await optionsRes.json();
      // 在註冊選項中加入使用者名稱
      options.user.name = name;
      options.user.displayName = name;

      // 步驟 2: 啟動瀏覽器的 Passkey 註冊流程
      setStatusMessage('請依照瀏覽器提示，建立您的 Passkey...');
      const registration = await fido2ClientService.startRegistration(options);

      // 步驟 3: 將註冊結果傳送至後端進行驗證
      setStatusMessage('正在驗證您的新 Passkey...');
      const verifyRes = await fetch(`${origin}${routes.auth.webauthn.verify()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || '註冊驗證失敗。');
      }

      // 步驟 4: 註冊成功
      setStatusMessage('✅ 註冊成功！正在為您登入...');
      localStorage.setItem('dewt', verifyData.payload.dewt);
      // 提示使用者備份恢復金鑰
      alert(`請務必備份您的恢復金鑰，它只會出現這一次：\n\n${verifyData.payload.backupKey}`);
      setTimeout(() => router.push('/profile'), 2000); // 跳轉到個人資料頁
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤。';
      setStatusMessage(
        (err as Error).name === 'NotAllowedError' ? '您取消了註冊操作。' : '註冊失敗，請重試。'
      );
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [name, router]);

  const canSubmit = name.trim() !== '' && agreed && !isLoading && isFidoAvailable;

  return (
    <div className="flex w-full max-w-md flex-col items-center rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-2xl font-bold text-gray-800">Create Your Digital ID</h1>

      <div className="mt-8 w-full space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Enter your full legal name
          </label>
          <input
            type="text"
            id="name"
            aria-labelledby="name-label"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            placeholder="例如：王小明"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center">
          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="size-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              disabled={isLoading}
              aria-labelledby="terms-label"
            />
            <label id="terms-label" htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I have read and agree to the{' '}
              <Link href="/terms" className="text-purple-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-purple-600 hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleRegister}
            disabled={!canSubmit}
            className="w-full rounded-md bg-purple-600 px-4 py-2 text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isLoading ? '處理中...' : 'Register & Verify'}
          </button>
          <Link
            href="/auth/login"
            className="w-full rounded-md bg-gray-200 px-4 py-2 text-center text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </div>

      <StatusDisplay status={statusMessage} error={error} />
    </div>
  );
}
