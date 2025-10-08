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
      // Info: (20251008 - Tzuhan) 步驟 1: 從後端獲取註冊選項
      const optionsRes = await fetch(`${origin}${routes.auth.webauthn.options('register')}`);
      if (!optionsRes.ok) throw new Error('無法從伺服器獲取註冊選項。');
      const options = await optionsRes.json();

      // Info: (20251008 - Tzuhan) 將使用者輸入的名稱加入到註冊選項中
      options.user.name = name;
      options.user.displayName = name;

      // Info: (20251008 - Tzuhan) 步驟 2: 啟動瀏覽器的 Passkey 註冊流程
      setStatusMessage('請依照瀏覽器提示，建立您的 Passkey...');
      const registration = await fido2ClientService.startRegistration(options);

      // Info: (20251008 - Tzuhan) 步驟 3: 將註冊結果傳送至後端進行驗證
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

      // Info: (20251008 - Tzuhan) 步驟 4: 註冊成功
      setStatusMessage('✅ 註冊成功！正在為您登入...');
      localStorage.setItem('dewt', verifyData.payload.dewt);

      // Info: (20251008 - Tzuhan) 提示使用者備份恢復金鑰
      alert(`請務必備份您的恢復金鑰，它只會出現這一次：\n\n${verifyData.payload.backupKey}`);

      setTimeout(() => router.push(BM_URL.PROFILE), 2000);
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
    <div className="flex w-full grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 shadow-lg sm:p-12">
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            建立您的 Digital ID
          </h1>
          <p className="mt-2 text-gray-500">只需一步，即可擁有安全的去中心化身份</p>

          <div className="mt-10 w-full space-y-6 sm:max-w-sm">
            <div>
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                您的全名
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="name"
                  aria-labelledby="name-label"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-md border-0 px-3 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600"
                  placeholder="例如：王小明"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center gap-x-3">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="size-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                disabled={isLoading}
                aria-labelledby="terms-label"
              />
              <label htmlFor="terms" className="block text-sm leading-6 text-gray-900">
                我已閱讀並同意
                <Link href="/terms" className="ml-1 font-semibold text-purple-600 hover:underline">
                  服務條款
                </Link>
              </label>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <button
                onClick={handleRegister}
                disabled={!canSubmit}
                className="w-full rounded-lg bg-purple-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:scale-100"
              >
                {isLoading ? '處理中...' : '註冊並以 Passkey 驗證'}
              </button>
              <Link
                href={BM_URL.AUTH_LOGIN}
                className="w-full rounded-lg bg-white px-5 py-3.5 text-center text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-transform hover:scale-105 hover:bg-gray-50"
              >
                取消
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 w-full">
          <StatusDisplay status={statusMessage} error={error} />
        </div>
      </div>
    </div>
  );
}
