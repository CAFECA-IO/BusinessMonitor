'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/config/api-routes';
import Layout from '@/components/common/layout';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import {
  createAndEncryptBlockchainKey,
  decryptAndUseBlockchainKey,
} from '@/lib/blockchain-key-manager';
import type { IdentityAccount } from '@prisma/client';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

// Info: (20251021 - Tzuhan) 擴充 IdentityAccount 型別以包含從 /me API 回傳的額外欄位
interface IUserProfile extends IdentityAccount {
  ethAddress: string;
  isAuthenticated: boolean;
}

export default function ProfilePage() {
  const [keyStatus, setKeyStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isKeyLoading, setIsKeyLoading] = useState<boolean>(false);
  const router = useRouter();

  // Info: (20251021 - Tzuhan) 使用 useAuth 作為唯一的身份狀態來源
  const { user, isLoading: isAuthLoading, logout, refetchUser } = useAuth();

  // Info: (20251021 - Tzuhan) 更新登出處理函式
  const handleLogout = () => {
    logout(); // Info: (20251021 - Tzuhan) 使用 context 提供的 logout 函式
    router.push(BM_URL.LOGIN);
  };

  const handleCreateKey = async () => {
    if (!user) return;

    setIsKeyLoading(true);
    setKeyStatus('正在準備生成金鑰，請依照瀏覽器提示操作...');
    setError(null);
    try {
      const keyBundle = await createAndEncryptBlockchainKey(user.id);
      setKeyStatus('金鑰已在您的裝置上生成並加密，正在儲存至伺服器...');

      const dewt = localStorage.getItem('dewt');
      const storeRes = await fetch(`${origin}${routes.keyManagement.store()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dewt}` },
        body: JSON.stringify(keyBundle),
      });

      if (!storeRes.ok) {
        const errorData = await storeRes.json();
        throw new Error(errorData.message || '無法將加密金鑰儲存至伺服器。');
      }

      setKeyStatus(`✅ 金鑰已成功生成並儲存！您的新錢包地址: ${keyBundle.address}`);
      await refetchUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : '發生未知錯誤';
      setKeyStatus('金鑰生成失敗。');
      setError(message);
    } finally {
      setIsKeyLoading(false);
    }
  };

  const handleSignTest = async () => {
    if (!user || !user.encryptedBlockchainKey || !user.derivationNonce) {
      setError('缺少必要的金鑰資訊來執行簽署。');
      return;
    }
    setIsKeyLoading(true);
    setKeyStatus('請依照瀏覽器提示進行驗證以解鎖金鑰...');
    setError(null);
    try {
      const wallet = await decryptAndUseBlockchainKey(
        user.id,
        user.encryptedBlockchainKey,
        user.derivationNonce
      );

      setKeyStatus('金鑰解鎖成功！正在簽署一筆測試訊息...');
      const message = '這是一筆來自 cafeca 平台的測試簽章';
      const signature = await wallet.signMessage(message);

      setKeyStatus(`✅ 簽署成功！簽章為: ${signature.substring(0, 40)}...`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '發生未知錯誤';
      setKeyStatus('簽署失敗。');
      setError(message);
    } finally {
      setIsKeyLoading(false);
    }
  };

  // Info: (20251021 - Tzuhan) 主要的載入和權限檢查邏輯
  useEffect(() => {
    // Info: (20251021 - Tzuhan 如果 AuthContext 還在載入中，則不執行任何操作
    if (isAuthLoading) {
      return;
    }
    // Info: (20251021 - Tzuhan 如果載入完畢，但 user 為 null (未登入)，則導向登入頁
    if (!user) {
      router.replace(BM_URL.LOGIN);
    }
  }, [user, isAuthLoading, router]);

  // Info: (20251021 - Tzuhan) 處理載入狀態的 UI
  if (isAuthLoading || !user) {
    return (
      <Layout>
        <div className="flex w-full grow flex-col items-center justify-center p-4">
          <p className="animate-pulse text-gray-500">正在載入使用者資料...</p>
        </div>
      </Layout>
    );
  }

  // Info: (20251021 - Tzuhan) 主要 JSX 內容，直接使用從 useAuth 來的 user 物件
  return (
    <Layout>
      <div className="flex w-full grow flex-col items-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* User Info Section */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">我的 Digital ID</h1>
            <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
              <div>
                <p className="text-sm font-medium text-gray-500">姓名</p>
                <p className="text-lg font-semibold text-gray-900">{user.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ID / ETH Address (舊)</p>
                <p className="break-all font-mono text-sm text-gray-700">
                  {(user as IUserProfile).ethAddress || user.ethereumAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Blockchain Key Section */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">區塊鏈錢包</h2>
            <div className="mt-6 border-t border-gray-200 pt-6">
              {user.blockchainAddress ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">您的 cafeca 錢包地址</p>
                    <p className="break-all font-mono text-sm text-gray-700">
                      {user.blockchainAddress}
                    </p>
                  </div>
                  <button
                    onClick={handleSignTest}
                    disabled={isKeyLoading}
                    className="w-full rounded-lg bg-green-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {isKeyLoading ? '處理中...' : '簽署一筆測試訊息'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    您尚未建立您的 cafeca 區塊鏈錢包。建立錢包後，您將能參與未來的鏈上功能。
                  </p>
                  <button
                    onClick={handleCreateKey}
                    disabled={isKeyLoading}
                    className="w-full rounded-lg bg-purple-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    {isKeyLoading ? '生成中...' : '建立我的區塊鏈錢包'}
                  </button>
                </div>
              )}
              {(keyStatus || error) && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">{keyStatus}</p>
                  {error && <p className="mt-2 break-all text-red-600">錯誤訊息: {error}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Actions Section */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link
                href={BM_URL.ADD_DEVICE}
                className="block w-full rounded-lg bg-white px-5 py-3 text-center text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                新增裝置
              </Link>
              <button
                onClick={handleLogout}
                className="w-full rounded-lg bg-red-500 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-red-600"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
