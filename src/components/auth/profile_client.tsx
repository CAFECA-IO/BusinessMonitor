'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiMonitor } from 'react-icons/fi';
import { LuIdCard, LuScanLine, LuSettings } from 'react-icons/lu';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { PiSignOut } from 'react-icons/pi';
import { routes } from '@/config/api-routes';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import QRCodeScanner from '@/components/auth/qr_code_scanner';
import ProfileSettingTab from '@/components/auth/profile_setting_tab';
import {
  createAndEncryptBlockchainKey,
  decryptAndUseBlockchainKey,
} from '@/lib/blockchain-key-manager';
import { DEFAULT_USER_AVATAR } from '@/constants/display';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

enum ProfileTab {
  MY_ID = 'my-id',
  MESSAGE = 'message',
  SCAN = 'scan',
  ACCESS = 'access',
  SETTING = 'setting',
}

export default function ProfileClient() {
  const [currentTab, setCurrentTab] = useState<ProfileTab>(ProfileTab.MY_ID);
  const [keyStatus, setKeyStatus] = useState<string>('');
  const [isShowScanner, setIsShowScanner] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeyLoading, setIsKeyLoading] = useState<boolean>(false);
  const router = useRouter();

  // Info: (20251021 - Tzuhan) 使用 useAuth 作為唯一的身份狀態來源
  const { user, isLoading: isAuthLoading, logout, refetchUser } = useAuth();

  // ToDo: (20251022 - Julian) mock user title
  const userTitle = 'Digital Citizen';

  const bgColor =
    currentTab === ProfileTab.MY_ID ? 'bg-profile bg-cover bg-no-repeat' : 'bg-surface-background';
  const scanBtnStyle =
    'size-66px p-15px mx-auto flex -translate-y-32px flex-col items-center justify-center rounded-full bg-button-primary shadow-drop-L';

  // Info: (20251022 - Julian) Tab 文字顏色
  const myIdTextColor = currentTab === ProfileTab.MY_ID ? 'text-text-brand' : 'text-text-secondary';
  const messageTextColor =
    currentTab === ProfileTab.MESSAGE ? 'text-text-brand' : 'text-text-secondary';
  const accessTextColor =
    currentTab === ProfileTab.ACCESS ? 'text-text-brand' : 'text-text-secondary';
  const settingTextColor =
    currentTab === ProfileTab.SETTING ? 'text-text-brand' : 'text-text-secondary';

  const toggleScanner = () => setIsShowScanner((prev) => !prev);

  // Info: (20251022 - Julian) Tab 切換處理函式
  const myIdClickHandler = () => {
    setCurrentTab(ProfileTab.MY_ID);
  };
  const messageClickHandler = () => {
    setCurrentTab(ProfileTab.MESSAGE);
  };
  const accessClickHandler = () => {
    setCurrentTab(ProfileTab.ACCESS);
  };
  const settingClickHandler = () => {
    setCurrentTab(ProfileTab.SETTING);
  };

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
      <div className="flex w-full grow flex-col items-center justify-center p-4">
        <p className="animate-pulse text-gray-500">正在載入使用者資料...</p>
      </div>
    );
  }

  // ToDo: (20251022 - Luphia) remove eslint-disable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const old = (
    /* Info: (20251021 - Tzuhan) Blockchain Key Section */
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">區塊鏈錢包</h2>
      <div className="mt-6 border-t border-gray-200 pt-6">
        {user.blockchainAddress ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">您的 cafeca 錢包地址</p>
              <p className="break-all font-mono text-sm text-gray-700">{user.blockchainAddress}</p>
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
  );

  const displayedNavbar = (
    <div className="grid w-full grid-cols-5 gap-8px rounded-t-radius-s bg-white px-16px pb-16px pt-8px">
      <button
        type="button"
        onClick={myIdClickHandler}
        className="flex flex-col items-center gap-4px px-8px py-4px"
      >
        <LuIdCard size={24} className="text-text-primary" />
        <p className={`text-xs font-medium ${myIdTextColor}`}>My ID</p>
      </button>
      <button
        type="button"
        onClick={messageClickHandler}
        className="flex flex-col items-center gap-4px px-8px py-4px"
      >
        <IoChatbubbleEllipsesOutline size={24} className="text-text-primary" />
        <p className={`text-xs font-medium ${messageTextColor}`}>Message</p>
      </button>
      <button type="button" onClick={toggleScanner} className={scanBtnStyle}>
        <LuScanLine size={36} className="text-text-invert" />
      </button>
      <button
        type="button"
        onClick={accessClickHandler}
        className="flex flex-col items-center gap-4px px-8px py-4px"
      >
        <FiMonitor size={24} className="text-text-primary" />
        <p className={`text-xs font-medium ${accessTextColor}`}>Access</p>
      </button>
      <button
        type="button"
        onClick={settingClickHandler}
        className="flex flex-col items-center gap-4px px-8px py-4px"
      >
        <LuSettings size={24} className="text-text-primary" />
        <p className={`text-xs font-medium ${settingTextColor}`}>Setting</p>
      </button>
    </div>
  );

  const displayedProfileTab = (
    <div className="relative w-full flex-1">
      {/* Info: (20251022 - Julian) Wave Shape Cover */}
      {/* ToDo: (20251023 - Julian) Animation */}
      <div className="absolute z-0 h-1/2 w-full">
        <Image
          src="/elements/profile_cover.svg"
          fill
          objectFit="cover"
          objectPosition="bottom"
          alt="wave_shape_cover"
        />
      </div>

      <div className="flex h-full flex-col">
        {/* Info: (20251022 - Julian) Header */}
        <div className="z-10 flex w-full justify-end px-16px py-20px">
          <button type="button" onClick={handleLogout} className="p-10px text-text-primary">
            <PiSignOut size={24} />
          </button>
        </div>

        {/* Info: (20251022 - Julian) Main Content */}
        <div className="flex flex-1 flex-col items-center justify-center gap-24px">
          {/* Info: (20251022 - Julian) User Avatar */}
          <div className="relative flex flex-col items-center">
            <div className="size-180px overflow-hidden rounded-full">
              <Image
                src={user.photo ?? DEFAULT_USER_AVATAR}
                width={183}
                height={183}
                alt="user_avatar"
              />
            </div>
            <div className="-translate-y-10px rounded-radius-s bg-surface-brand px-12px py-6px text-sm font-medium text-text-invert">
              {userTitle}
            </div>
          </div>
          {/* Info: (20251022 - Julian) User Name */}
          <h2 className="text-h5 font-bold">{user.name ?? '-'}</h2>
        </div>
      </div>
    </div>
  );

  const displayedTab =
    currentTab === ProfileTab.MY_ID ? (
      displayedProfileTab
    ) : currentTab === ProfileTab.MESSAGE ? (
      // ToDo: (20251022 - Julian) During development
      <div className="h-full"></div>
    ) : currentTab === ProfileTab.ACCESS ? (
      // ToDo: (20251022 - Julian) During development
      <div className="h-full"></div>
    ) : (
      <ProfileSettingTab />
    );
  return (
    <div className={`${bgColor} relative flex min-h-[dvh] w-full grow flex-col items-center`}>
      {displayedTab}

      {/* Info: (20251022 - Julian) Bottom Navbar */}
      {displayedNavbar}

      {/* Info: (20251023 - Julian) QR code scanner */}
      {isShowScanner && <QRCodeScanner onClose={toggleScanner} />}
    </div>
  );
}
