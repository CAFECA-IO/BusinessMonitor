'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startRegistration } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';

// Info: (20250926 - Tzuhan) 輔助元件：用於優雅地顯示 JSON 結果
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

export default function RecoverPage() {
  const [backupKey, setBackupKey] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('輸入您的備份碼以新增裝置。');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<object | null>(null);
  const router = useRouter();

  const handleRecovery = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Info: (20250926 - Tzuhan) --- 步驟一: 提交備份碼，獲取 FIDO2 註冊選項 ---
      setStatusMessage('正在驗證備份碼...');
      const initiateRes = await fetch(routes.auth.recover.initiate(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupKey }),
      });

      const initiateData = await initiateRes.json();
      if (!initiateRes.ok || !initiateData.success) {
        throw new Error(initiateData.message || '驗證備份碼失敗。');
      }
      const registrationOptions = initiateData.payload;

      // Info: (20250926 - Tzuhan) --- 步驟二: 使用獲取的選項，在新裝置上註冊 Passkey ---
      setStatusMessage('備份碼驗證成功。請在此裝置上建立一個新的 Passkey...');
      const registrationData = await startRegistration(registrationOptions);

      // Info: (20250926 - Tzuhan) --- 步驟三: 提交新 Passkey 的註冊資料以完成恢復流程 ---
      setStatusMessage('正在向伺服器驗證新的 Passkey...');
      const completeRes = await fetch(routes.auth.recover.complete(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok || !completeData.success) {
        throw new Error(completeData.message || '完成恢復流程失敗。');
      }

      // Info: (20250926 - Tzuhan) --- 成功 ---
      setStatusMessage('✅ 裝置新增成功！正在將您導向...');
      const { dewt } = completeData.payload;
      localStorage.setItem('dewt', dewt);
      setResult(completeData.payload);

      setTimeout(() => {
        router.push('/demo/me');
      }, 1500);
    } catch (err) {
      let msg: string;
      if (err && typeof err === 'object' && 'name' in err && 'message' in err) {
        const errorObj = err as { name: string; message: string };
        msg = errorObj.name === 'NotAllowedError' ? 'Passkey 建立已被取消。' : errorObj.message;
      } else {
        msg = err instanceof Error ? err.message : '發生未知錯誤。';
      }
      setStatusMessage('❌ 恢復失敗');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [backupKey, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 font-sans">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">身份恢復</h1>
          <p className="mt-2 text-lg text-gray-500">透過備份碼新增裝置</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-md">
          <div className="flex flex-col space-y-4">
            <label htmlFor="backupKey" className="text-sm font-medium text-gray-700">
              備份碼
            </label>
            <input
              id="backupKey"
              type="text"
              value={backupKey}
              onChange={(e) => setBackupKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="block w-full rounded-md border-gray-300 font-mono shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleRecovery}
              disabled={isLoading || !backupKey}
              className="w-full rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? '處理中...' : '驗證並新增裝置'}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-3 border-b pb-2 text-lg font-semibold text-gray-700">恢復狀態</h2>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500">狀態:</p>
            <p className="text-md font-bold text-gray-800">{statusMessage}</p>
          </div>
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-bold">錯誤:</p>
              <p className="break-words">{error}</p>
            </div>
          )}
          <ResultDisplay title="伺服器回應" data={result} />
          <div className="mt-4 flex justify-between">
            <Link href="/demo/auth" className="text-blue-600 hover:underline">
              &larr; 返回登入頁
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
