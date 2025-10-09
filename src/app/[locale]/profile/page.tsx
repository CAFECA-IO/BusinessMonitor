'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { IdentityAccount } from '@prisma/client';
import { routes } from '@/config/api-routes';

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

// Info: (20250925 - Tzuhan) 【新增】用於顯示格式化後的使用者資訊
const UserInfoCard = ({ user }: { user: Partial<IdentityAccount> }) => (
  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
    <h3 className="text-lg font-bold text-green-800">✅ 驗證成功</h3>
    <p className="mt-1 text-sm text-green-700">成功獲取您的使用者資訊：</p>
    <div className="mt-3 space-y-2 text-sm">
      <div>
        <span className="font-semibold text-gray-600">ID:</span>
        <span className="ml-2 font-mono text-gray-800">{user.id}</span>
      </div>
      <div>
        <span className="font-semibold text-gray-600">名稱:</span>
        <span className="ml-2 text-gray-800">{user.name}</span>
      </div>
      <div>
        <span className="font-semibold text-gray-600">以太坊地址:</span>
        <span className="ml-2 font-mono text-gray-800">{user.ethereumAddress}</span>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [userData, setUserData] = useState<Partial<IdentityAccount> | null>(null);
  const [apiResponse, setApiResponse] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dewt, setDewt] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedDewt = localStorage.getItem('dewt');
    if (!storedDewt) {
      router.replace('/demo');
      return;
    }
    setDewt(storedDewt);

    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(routes.auth.me(), {
          headers: { Authorization: `Bearer ${storedDewt}` },
        });

        const result = await res.json();
        setApiResponse(result); // Info: (20250925 - Tzuhan) 無論成功失敗，都先儲存原始回應以供偵錯

        if (!res.ok || !result.success) {
          throw new Error(result.message || 'Failed to fetch user data');
        }

        // Info: (20250925 - Tzuhan) 【關鍵步驟】API 呼叫成功後，將 payload 中的使用者資料存到 state 中
        setUserData(result.payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        localStorage.removeItem('dewt');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('dewt');
    router.push('/');
  };

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

          {/* Info: (20250925 - Tzuhan) 【更新】優先顯示格式化後的使用者資訊 */}
          {userData && <UserInfoCard user={userData} />}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-bold">錯誤:</p>
              <p className="break-words">{error}</p>
              <p className="mt-2 text-sm">Token 已被清除，請返回重新登入。</p>
            </div>
          )}

          {/* Info: (20250925 - Tzuhan) 為了偵錯，我們仍然可以顯示完整的 API 回應和 DeWT */}
          <div className="mt-4 space-y-4">
            {apiResponse && <ResultDisplay title="完整的 API 回應 (偵錯用)" data={apiResponse} />}
            {dewt && <ResultDisplay title="目前的 DeWT (偵錯用)" data={dewt} />}
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <Link href="/" className="text-blue-600 hover:underline">
              &larr; 返回首頁
            </Link>
            {/* Info: (20250925 - Tzuhan) 【新增】登出按鈕 */}
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
