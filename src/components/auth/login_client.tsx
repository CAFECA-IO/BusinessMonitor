'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

const StatusDisplay = ({ status, error }: { status: string; error: string | null }) => (
  <div className="mt-8 w-full rounded-lg border border-gray-200 bg-gray-50 p-6">
    <h3 className="text-lg font-semibold text-gray-800">處理狀態</h3>
    <p className="mt-2 text-gray-600">
      狀態: <span className="font-medium text-gray-900">{status}</span>
    </p>
    {error && (
      <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
        <p className="font-bold text-red-700">發生錯誤:</p>
        <p className="mt-1 break-words text-red-600">{error}</p>
      </div>
    )}
  </div>
);

export default function LoginClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('點擊按鈕以 Passkey 登入或註冊。');
  const [error, setError] = useState<string | null>(null);
  const [isFidoAvailable, setIsFidoAvailable] = useState(true);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (!fido2ClientService.isAvailable()) {
      setIsFidoAvailable(false);
      setStatusMessage('此環境不支援 Passkey 功能。');
      setError('請使用支援的瀏覽器並確保在安全的 HTTPS 環境下操作。');
    }
  }, []);

  const handleLogin = useCallback(async () => {
    if (!isFidoAvailable) return;

    setIsLoading(true);
    setError(null);
    setStatusMessage('正在準備 Passkey 登入...');

    try {
      const optionsRes = await fetch(`${origin}${routes.auth.webauthn.options()}`);
      if (!optionsRes.ok) throw new Error('無法從伺服器獲取登入選項。');
      const options = await optionsRes.json();

      setStatusMessage('請依照瀏覽器提示進行驗證...');
      const authentication = await fido2ClientService.startLogin(options);

      setStatusMessage('正在驗證您的 Passkey...');
      const verifyRes = await fetch(`${origin}${routes.auth.webauthn.verify()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authentication),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || '登入驗證失敗。');
      }

      setStatusMessage('✅ 登入成功！正在跳轉...');
      // localStorage.setItem('dewt', verifyData.payload.dewt);
      await login(verifyData.payload.dewt);
      setTimeout(() => router.push('/profile'), 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤。';
      setStatusMessage(
        (err as Error).name === 'NotAllowedError' ? '您取消了登入操作。' : '登入失敗，請重試。'
      );
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [router, isFidoAvailable, login]);

  return (
    <div className="flex w-full grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 shadow-lg sm:p-12">
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            登入您的 Digital ID
          </h1>
          <p className="mt-2 text-gray-500">使用已註冊的 Passkey 快速登入</p>

          <div className="mt-10 w-full space-y-4 sm:max-w-sm">
            <button
              onClick={handleLogin}
              disabled={isLoading || !isFidoAvailable}
              className="w-full rounded-lg bg-purple-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:scale-100"
            >
              {isLoading ? '處理中...' : '以 Passkey 登入'}
            </button>
            <Link
              href={BM_URL.LOGIN_WITH_EXISTING_DEVICE}
              className="block w-full rounded-lg bg-gray-700 px-5 py-3.5 text-center text-base font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-gray-800"
            >
              使用其他裝置登入
            </Link>
          </div>
          <p className="mt-8 text-center text-sm text-gray-500">
            還沒有 Digital ID?{' '}
            <Link
              href={BM_URL.SIGN_UP}
              className="font-semibold leading-6 text-purple-600 hover:text-purple-500 hover:underline"
            >
              立即建立一個
            </Link>
          </p>
        </div>
        <div className="mt-8 w-full">
          <StatusDisplay status={statusMessage} error={error} />
        </div>
      </div>
    </div>
  );
}
