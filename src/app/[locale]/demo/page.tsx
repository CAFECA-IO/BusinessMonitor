'use client';

import { useState, useCallback } from 'react';
import { startRegistration, startLogin } from '@/lib/fido2-client';

// Info: (20250919 - Tzuhan) 輔助元件：用於優雅地顯示 JSON 結果
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

export default function WebAuthnFinalDemoPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to begin the seamless flow.');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<object | null>(null);

  const resetState = () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
  };

  const handleAuth = useCallback(async () => {
    resetState();

    // Info: (20250919 - Tzuhan) --- 步驟一: 先假設用戶已註冊，嘗試「登入」 ---
    setStatusMessage('Attempting to sign in with an existing Passkey...');
    try {
      // Info: (20250919 - Tzuhan) 請求登入選項 (不帶 intent)
      const loginOptionsRes = await fetch('/api/v1/secure/webauthn_options');
      if (!loginOptionsRes.ok) throw new Error('Could not fetch login options from server.');
      const loginOptions = await loginOptionsRes.json();

      const authData = await startLogin(loginOptions);

      setStatusMessage('Verifying login with server...');
      const verifyLoginRes = await fetch('/api/v1/secure/webauthn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });

      if (!verifyLoginRes.ok) {
        const errData = await verifyLoginRes.json();
        throw new Error(errData.details || 'Login verification failed.');
      }

      const data = await verifyLoginRes.json();
      setStatusMessage('✅ Login Successful!');
      setResult(data);
      setIsLoading(false);
      return; // Info: (20250919 - Tzuhan) 登入成功，流程結束
    } catch (loginError) {
      // Info: (20250919 - Tzuhan) 如果用戶取消登入，或瀏覽器找不到可用 Passkey，就會觸發 NotAllowedError。
      // Info: (20250919 - Tzuhan) 我們將此視為需要註冊的信號，並自動降級。
      if (
        typeof loginError === 'object' &&
        loginError !== null &&
        'name' in loginError &&
        (loginError as { name?: string }).name !== 'NotAllowedError'
      ) {
        setStatusMessage('❌ Login attempt failed');
        setError((loginError as { message?: string }).message || 'Login attempt failed');
        setIsLoading(false);
        return; // Info: (20250919 - Tzuhan) 其他無法處理的錯誤，終止流程
      }
    }

    // Info: (20250919 - Tzuhan) --- 步驟二: 「登入」失敗，自動降級到「註冊」流程 ---
    setStatusMessage('No existing Passkey found or used. Attempting to register a new one...');
    try {
      // Info: (20250919 - Tzuhan) 請求註冊選項 (附上 intent=register 參數)
      const regOptionsRes = await fetch('/api/v1/secure/webauthn_options?intent=register');
      if (!regOptionsRes.ok) throw new Error('Could not fetch registration options from server.');
      const regOptions = await regOptionsRes.json();

      setStatusMessage('Please create your Passkey in the browser prompt...');
      const registrationData = await startRegistration(regOptions);

      setStatusMessage('Verifying new passkey with server...');
      const verifyRegRes = await fetch('/api/v1/secure/webauthn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      if (!verifyRegRes.ok) {
        const errData = await verifyRegRes.json();
        throw new Error(errData.details || 'Registration verification failed.');
      }

      const data = await verifyRegRes.json();
      setStatusMessage('✅ Registration Successful! You are now logged in.');
      setResult(data);
      if (data.backupKey) {
        alert(`Registration successful! Please save your backup key: ${data.backupKey}`);
      }
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 font-sans">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">CAFECA Digital ID</h1>
          <p className="mt-2 text-lg text-gray-500">Final Architecture Demo</p>
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
        </div>
      </div>
    </main>
  );
}
