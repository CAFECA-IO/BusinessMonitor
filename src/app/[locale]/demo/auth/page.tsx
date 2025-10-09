'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';
import { BM_URL } from '@/constants/url';

// Info: (20250925 - Tzuhan) 輔助元件：用於優雅地顯示 JSON 結果
const ResultDisplay = ({ title, data }: { title: string; data: object | string | null }) => {
  if (!data) return null;
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-500">{title}:</p>
      <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-all rounded-lg bg-gray-100 p-4 text-xs text-gray-800">
        <code>{content}</code>
      </pre>
    </div>
  );
};

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to begin the seamless flow.');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<object | null>(null);
  // Info: (20251001-tzuhan) 新增狀態來追蹤 FIDO 是否可用
  const [isFidoAvailable, setIsFidoAvailable] = useState<boolean>(true);
  const router = useRouter();

  // Info: (20251001-tzuhan) 在組件掛載時檢查 WebAuthn 是否可用
  useEffect(() => {
    if (!fido2ClientService.isAvailable()) {
      setIsFidoAvailable(false);
      setStatusMessage('❌ 錯誤');
      setError(
        '此瀏覽器不支援 WebAuthn/Passkey，或您正在一個不安全的來源 (non-secure origin) 上。請使用 HTTPS 或 localhost。'
      );
    }
  }, []);

  const resetState = () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
  };

  const handleAuthSuccess = (data: { dewt: string; backupKey?: string }) => {
    setStatusMessage('✅ Success! Redirecting...');
    localStorage.setItem('dewt', data.dewt);
    setResult(data);

    /**
     * Info: (20251009 - Tzuhan) Deprecated
    if (data.backupKey) {
      // Info: (20251001 - Tzuhan) 改用更友善的提示方式，避免使用 alert
      prompt(
        'Registration successful! Please save your backup key in a safe place:',
        data.backupKey
      );
    }
     */

    setTimeout(() => {
      router.push(BM_URL.PROFILE);
    }, 1000);
  };

  const handleAuth = useCallback(async () => {
    if (!isFidoAvailable) {
      return; // Info: (20251001-tzuhan) 如果 FIDO 不可用，不執行任何操作
    }
    resetState();

    // Info: (20250925 - Tzuhan) --- 步驟一: 嘗試「登入」 ---
    setStatusMessage('Attempting to sign in with an existing Passkey...');
    try {
      const loginOptionsRes = await fetch(routes.auth.webauthn.options());
      if (!loginOptionsRes.ok) throw new Error('Could not fetch login options from server.');
      const loginOptions = await loginOptionsRes.json();

      // Info: (20251001-tzuhan) 【修正】使用 fido2ClientService 的方法
      const authData = await fido2ClientService.startLogin(loginOptions);

      setStatusMessage('Verifying login with server...');
      const verifyLoginRes = await fetch(routes.auth.webauthn.verify(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });

      const data = await verifyLoginRes.json();
      if (!verifyLoginRes.ok || !data.success) {
        throw new Error(data.message || 'Login verification failed.');
      }

      handleAuthSuccess(data.payload);
      return;
    } catch (loginError) {
      // Info: (20251001-tzuhan) 捕獲所有登入錯誤，包括 NotAllowedError (使用者取消)
      const err = loginError as Error;
      if (err.name !== 'NotAllowedError') {
        setStatusMessage('❌ Login attempt failed');
        setError(err.message || 'Login attempt failed');
        setIsLoading(false);
        return;
      }
      // Info: (20251001-tzuhan) 如果是 NotAllowedError，則靜默地繼續到註冊流程
    }

    // Info: (20250925 - Tzuhan) --- 步驟二: 降級到「註冊」 ---
    setStatusMessage('No existing Passkey found or used. Attempting to register a new one...');
    try {
      const regOptionsRes = await fetch(routes.auth.webauthn.options('register'));
      if (!regOptionsRes.ok) throw new Error('Could not fetch registration options from server.');
      const regOptions = await regOptionsRes.json();

      setStatusMessage('Please create your Passkey in the browser prompt...');
      // Info: (20251001-tzuhan) 【修正】使用 fido2ClientService 的方法
      const registrationData = await fido2ClientService.startRegistration(regOptions);

      setStatusMessage('Verifying new passkey with server...');
      const verifyRegRes = await fetch(routes.auth.webauthn.verify(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await verifyRegRes.json();
      if (!verifyRegRes.ok || !data.success) {
        throw new Error(data.message || 'Registration verification failed.');
      }

      handleAuthSuccess(data.payload);
    } catch (regError) {
      const err = regError as Error;
      const msg =
        err.name === 'NotAllowedError' ? 'Registration was canceled by user.' : err.message;
      setStatusMessage('❌ Registration Failed');
      setError(msg);
      setIsLoading(false);
    }
  }, [router, isFidoAvailable]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 font-sans">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">CAFECA Digital ID</h1>
          <p className="text-lg text-gray-500">FIDO2/WebAuthn Login</p>
        </div>

        <div className="flex flex-col items-center rounded-xl bg-white p-8 shadow-md">
          <button
            onClick={handleAuth}
            disabled={isLoading || !isFidoAvailable} // Info: (20251001-tzuhan) 如果 FIDO 不可用，也禁用按鈕
            className="w-full max-w-xs rounded-lg bg-purple-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isLoading ? 'Processing...' : 'Sign in / Register with Passkey'}
          </button>
          <p className="mt-4 text-xs text-gray-500">
            This single button handles both login and registration.
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-3 border-b pb-2 text-lg font-semibold text-gray-700">
            Verification Status
          </h2>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500">Status:</p>
            <p className="text-lg font-bold text-gray-800">{statusMessage}</p>
          </div>
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-bold">Error:</p>
              <p className="break-words">{error}</p>
            </div>
          )}
          <ResultDisplay title="Server Response" data={result} />
          <div className="mt-4 flex justify-between">
            <Link href="/" className="text-blue-600 hover:underline">
              &larr; 返回首頁
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
