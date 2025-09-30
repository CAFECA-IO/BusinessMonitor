'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startRegistration, startLogin } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';

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
  const router = useRouter();

  const resetState = () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
  };

  const handleAuthSuccess = (data: { dewt: string; backupKey?: string }) => {
    setStatusMessage('✅ Success! Redirecting...');
    localStorage.setItem('dewt', data.dewt);
    setResult(data);

    if (data.backupKey) {
      alert(`Registration successful! Please save your backup key: ${data.backupKey}`);
    }

    // Info: (20250925 - Tzuhan) 【關鍵步驟】延遲一小段時間後跳轉，讓使用者看到成功訊息
    setTimeout(() => {
      router.push('/demo/me');
    }, 1000);
  };

  const handleAuth = useCallback(async () => {
    resetState();

    // Info: (20250925 - Tzuhan) --- 步驟一: 嘗試「登入」 ---
    setStatusMessage('Attempting to sign in with an existing Passkey...');
    try {
      const loginOptionsRes = await fetch(routes.auth.webauthn.options());
      if (!loginOptionsRes.ok) throw new Error('Could not fetch login options from server.');
      const loginOptions = await loginOptionsRes.json();

      const authData = await startLogin(loginOptions);

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
      if (
        typeof loginError === 'object' &&
        loginError !== null &&
        'name' in loginError &&
        (loginError as { name?: string }).name !== 'NotAllowedError'
      ) {
        setStatusMessage('❌ Login attempt failed');
        setError((loginError as { message?: string }).message || 'Login attempt failed');
        setIsLoading(false);
        return;
      }
    }

    // Info: (20250925 - Tzuhan) --- 步驟二: 降級到「註冊」 ---
    setStatusMessage('No existing Passkey found or used. Attempting to register a new one...');
    try {
      const regOptionsRes = await fetch(routes.auth.webauthn.options('register'));
      if (!regOptionsRes.ok) throw new Error('Could not fetch registration options from server.');
      const regOptions = await regOptionsRes.json();

      setStatusMessage('Please create your Passkey in the browser prompt...');
      const registrationData = await startRegistration(regOptions);

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
      let msg: string;
      if (regError && typeof regError === 'object' && 'name' in regError && 'message' in regError) {
        const errorObj = regError as { name: string; message: string };
        msg =
          errorObj.name === 'NotAllowedError'
            ? 'Registration was canceled by user.'
            : errorObj.message;
      } else {
        msg = 'An unknown error occurred during registration.';
      }
      setStatusMessage('❌ Registration Failed');
      setError(msg);
      setIsLoading(false);
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 font-sans">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">CAFECA Digital ID</h1>
          <p className="mt-2 text-lg text-gray-500">FIDO2/WebAuthn Login</p>
        </div>

        <div className="flex flex-col items-center rounded-xl bg-white p-8 shadow-md">
          <button
            onClick={handleAuth}
            disabled={isLoading}
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
            <p className="text-md font-bold text-gray-800">{statusMessage}</p>
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
