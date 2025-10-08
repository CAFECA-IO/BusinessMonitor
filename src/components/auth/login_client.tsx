'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';
import { BM_URL } from '@/constants/url';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

const StatusDisplay = ({
  status,
  error,
  isAvailable,
}: {
  status: string;
  error: string | null;
  isAvailable: boolean;
}) => (
  <div className="mt-8 w-full rounded-lg bg-gray-100 p-4">
    <h2 className="text-lg font-semibold text-gray-800">處理狀態</h2>
    <p className="mt-2 text-gray-700">
      狀態: <span className="font-medium">{status}</span>
    </p>
    {error && <p className="mt-2 text-red-600">錯誤: {error}</p>}
    {!isAvailable && <p className="mt-2 text-yellow-600">警告: 此環境不支援 Passkey。</p>}
  </div>
);

const ActionButton = ({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full rounded-md bg-purple-600 px-4 py-2 text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
  >
    {children}
  </button>
);

export default function LoginClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('請選擇登入方式。');
  const [error, setError] = useState<string | null>(null);
  const [isFidoAvailable, setIsFidoAvailable] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!fido2ClientService.isAvailable()) {
      setIsFidoAvailable(false);
      setStatusMessage('Passkey 功能不可用。');
    }
  }, []);

  const handleLogin = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setStatusMessage('正在準備 Passkey 登入...');

    try {
      const optionsRes = await fetch(`${origin}${routes.auth.webauthn.options()}`);
      if (!optionsRes.ok) throw new Error('無法從伺服器獲取登入選項。');
      const options = await optionsRes.json();

      setStatusMessage('請使用您的 Passkey 進行驗證...');
      const assertion = await fido2ClientService.startLogin(options);

      setStatusMessage('正在驗證您的身分...');
      const verifyRes = await fetch(`${origin}${routes.auth.webauthn.verify()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assertion),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || '登入驗證失敗。');
      }

      setStatusMessage('✅ 登入成功！即將跳轉...');
      localStorage.setItem('dewt', verifyData.payload.dewt);
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
  }, [router]);

  return (
    <div className="flex w-full max-w-md flex-col items-center rounded-lg bg-white p-8 shadow-md">
      <h1 className="text-2xl font-bold text-gray-800">Digital ID 登入</h1>
      <p className="mt-2 text-gray-600">整合 Passkey 登入邏輯的正式頁面。</p>

      <div className="mt-8 flex w-full flex-col gap-4">
        <ActionButton onClick={handleLogin} disabled={isLoading || !isFidoAvailable}>
          {isLoading ? '處理中...' : 'Log in to my ID (使用 Passkey)'}
        </ActionButton>
        <Link href={BM_URL.AUTH_SIGNUP} passHref>
          <ActionButton>I don&apos;t have my Digital ID yet</ActionButton>
        </Link>
        <Link href={BM_URL.AUTH_ADD_DEVICE} passHref>
          <ActionButton>Log in on a New Device</ActionButton>
        </Link>
      </div>

      <StatusDisplay status={statusMessage} error={error} isAvailable={isFidoAvailable} />
    </div>
  );
}
