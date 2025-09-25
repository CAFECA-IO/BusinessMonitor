'use client';

import { routes } from '@/config/api-routes';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Info: (20250925 - Tzuhan) 輔助元件：用於優雅地顯示 JSON 結果
const ResultDisplay = ({ title, data }: { title: string; data: object | string | null }) => {
  if (!data) return null;
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-500">{title}:</p>
      <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap break-all rounded-lg bg-gray-100 p-4 text-xs text-gray-800">
        <code>{content}</code>
      </pre>
    </div>
  );
};

export default function DashboardPage() {
  const [apiResponse, setApiResponse] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dewt, setDewt] = useState<string | null>(null);

  useEffect(() => {
    // Info: (20250925 - Tzuhan) 在真實應用中，DeWT (JWT) 應該在登入成功後
    // 安全地儲存。為了演示，我們暫時將其存在 localStorage。
    const storedDewt = localStorage.getItem('dewt');
    setDewt(storedDewt);

    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = {};
        // Info: (20250925 - Tzuhan) 如果有 token，就加入到 Authorization 標頭中
        if (storedDewt) {
          headers['Authorization'] = `Bearer ${storedDewt}`;
        }

        // Info: (20250925 - Tzuhan) 使用您定義的 routes 物件來獲取 API 路徑
        const res = await fetch(routes.auth.me(), { headers });

        // Info: (20250925 - Tzuhan) 解析您定義的 IApiResponse 格式
        const result = await res.json();
        setApiResponse(result);

        if (!res.ok || !result.success) {
          throw new Error(result.message || 'Failed to fetch user data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        // Info: (20250925 - Tzuhan) 如果是 401 錯誤，可能是 token 過期，可以考慮導向回登入頁面
        if (
          err instanceof Error &&
          (err.message.includes('UNAUTHENTICATED') || err.message.includes('token'))
        ) {
          // window.location.href = '/'; // 可選的自動導向
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 font-sans">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">
            CAFECA Digital ID - Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-500">此頁面展示了如何呼叫一個受保護的 API 端點。</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-3 border-b pb-2 text-lg font-semibold text-gray-700">API 呼叫結果</h2>
          {isLoading && <p className="text-gray-600">正在從 /api/v1/secure/me 載入用戶資料...</p>}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-bold">錯誤:</p>
              <p className="break-words">{error}</p>
            </div>
          )}
          {apiResponse && <ResultDisplay title="完整的 API 回應" data={apiResponse} />}
          {dewt && <ResultDisplay title="目前的 DeWT (用於偵錯)" data={dewt} />}
          <div className="mt-4 text-center">
            <Link href="/" className="text-purple-600 hover:underline">
              返回登入頁面
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
