'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/config/api-routes';
import Layout from '@/components/common/layout';
import { BM_URL } from '@/constants/url';

// Info: (20251009 - Tzuhan) 在模組頂層讀取環境變數
const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

interface IUserProfile {
  id: string;
  name: string | null;
  ethAddress: string;
}

/**
 * Info: (20251009 - Tzuhan)
 * 使用者登入後的主要儀表板/個人資料頁。
 *
 * 職責：
 * 1. 從後端 /me API 獲取並顯示使用者資訊。
 * 2. 提供登出和新增裝置等核心操作的入口。
 */
export default function ProfilePage() {
  const [user, setUser] = useState<IUserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const dewt = localStorage.getItem('dewt');
      if (!dewt) {
        // Info: (20251009 - Tzuhan) 如果沒有 token，直接導向登入頁
        router.replace(BM_URL.LOGIN);
        return;
      }

      try {
        const res = await fetch(`${origin}${routes.auth.me()}`, {
          headers: {
            Authorization: `Bearer ${dewt}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem('dewt');
          router.replace(BM_URL.LOGIN);
          return;
        }

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || '無法獲取使用者資訊。');
        }
        setUser(data.payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : '發生未知錯誤。');
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('dewt');
    router.push(BM_URL.LOGIN);
  };

  return (
    <Layout>
      <div className="flex w-full grow flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">我的 Digital ID</h1>
            {error && <p className="mt-4 text-red-600">錯誤: {error}</p>}
            {!user && !error && (
              <p className="mt-4 animate-pulse text-gray-500">正在載入使用者資料...</p>
            )}
            {user && (
              <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">姓名</p>
                  <p className="text-lg font-semibold text-gray-900">{user.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ID / ETH Address</p>
                  <p className="break-all font-mono text-sm text-gray-700">{user.ethAddress}</p>
                </div>

                <div className="flex flex-col space-y-4 pt-6 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Link
                    href={BM_URL.ADD_DEVICE}
                    className="block w-full rounded-lg bg-white px-5 py-3 text-center text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-transform hover:scale-105 hover:bg-gray-50"
                  >
                    新增裝置
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-lg bg-red-500 px-5 py-3 text-base font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-red-600"
                  >
                    登出
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
