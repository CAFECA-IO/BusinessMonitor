'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaChartBar } from 'react-icons/fa';
import { FiMonitor } from 'react-icons/fi';
import { LuIdCard, LuScanLine, LuSettings } from 'react-icons/lu';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { PiSignOut } from 'react-icons/pi';
import { routes } from '@/config/api_routes';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import QRCodeScanner from '@/components/auth/qr_code_scanner';
import ProfileMessageTab from '@/components/auth/profile_message_tab';
import ProfileAccessTab from '@/components/auth/profile_access_tab';
import ProfileSettingTab from '@/components/auth/profile_setting_tab';
import { DEFAULT_USER_AVATAR } from '@/constants/display';

// Info: (20251128 - Tzuhan) 用於 SCW 操作與 Passkey 處理
import { fido2ClientService } from '@/lib/fido2-client';
import { parsePublicKeyCoordinates, bufferToBase64Url } from '@/lib/fido2-parse';
import { createPublicClient, http, parseAbi, type Address } from 'viem';
import type { IApiResponse } from '@/lib/response';
import type {
  RegisterOptions,
  AuthenticateOptions,
} from '@passwordless-id/webauthn/dist/esm/types';
import { RPC_URL } from '@/constants/config';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

// Info: (20251128 - Tzuhan) Factory 設定
const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_SCW_FACTORY_ADDRESS || '') as Address;

// Info: (20251128 - Tzuhan) Factory ABI
const factoryAbi = parseAbi([
  'function getAddress(uint256 pubKeyX, uint256 pubKeyY, uint256 salt) external view returns (address)',
]);

// Info: (20251128 - Tzuhan) 輔助函式
const toBigInt = (base64Url: string) => {
  try {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(base64);
    let hex = '0x';
    for (let i = 0; i < bin.length; i++) hex += bin.charCodeAt(i).toString(16).padStart(2, '0');
    return BigInt(hex);
  } catch (e) {
    console.error('Base64 conversion error:', e);
    return BigInt(0);
  }
};

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

  const { user, isLoading: isAuthLoading, logout, refetchUser } = useAuth();

  const userTitle = 'Digital Citizen';

  const bgColor =
    currentTab === ProfileTab.MY_ID ? 'bg-profile bg-cover bg-no-repeat' : 'bg-surface-background';
  const scanBtnStyle =
    'size-66px p-15px mx-auto flex -translate-y-32px flex-col items-center justify-center rounded-full bg-button-primary shadow-drop-L';

  const myIdTextColor = currentTab === ProfileTab.MY_ID ? 'text-text-brand' : 'text-text-secondary';
  const messageTextColor =
    currentTab === ProfileTab.MESSAGE ? 'text-text-brand' : 'text-text-secondary';
  const accessTextColor =
    currentTab === ProfileTab.ACCESS ? 'text-text-brand' : 'text-text-secondary';
  const settingTextColor =
    currentTab === ProfileTab.SETTING ? 'text-text-brand' : 'text-text-secondary';

  const toggleScanner = () => setIsShowScanner((prev) => !prev);

  const myIdClickHandler = () => setCurrentTab(ProfileTab.MY_ID);
  const messageClickHandler = () => setCurrentTab(ProfileTab.MESSAGE);
  const accessClickHandler = () => setCurrentTab(ProfileTab.ACCESS);
  const settingClickHandler = () => setCurrentTab(ProfileTab.SETTING);

  const handleLogout = () => {
    logout();
    router.push(BM_URL.LOGIN);
  };

  // Info: (20251128 - Tzuhan) 初始化錢包 (針對還沒有 SCW 地址的舊用戶)
  const handleInitializeWallet = async () => {
    if (!user) return;
    setIsKeyLoading(true);
    setKeyStatus('正在初始化錢包... 請註冊您的 Passkey');
    setError(null);

    try {
      // Info: (20251128 - Tzuhan) 1. 獲取註冊選項
      const optionsRes = await fetch(`${origin}${routes.auth.webauthn.options('register')}`);
      const optionsData: IApiResponse<RegisterOptions> = await optionsRes.json();
      if (!optionsData.success || !optionsData.payload) throw new Error('無法獲取註冊選項');

      const options = optionsData.payload;
      options.user = {
        name: user.name || 'User',
        displayName: user.name || ' User',
      };

      // Info: (20251128 - Tzuhan) 2. Passkey 註冊
      const credential = await fido2ClientService.startRegistration(options);

      // Info: (20251128 - Tzuhan) 3. 計算 SCW 地址
      let scwAddress = '';
      const salt = '0';

      if (FACTORY_ADDRESS) {
        const coords = parsePublicKeyCoordinates(credential.response.attestationObject);
        if (coords) {
          const pubKeyX = toBigInt(coords.x).toString();
          const pubKeyY = toBigInt(coords.y).toString();

          const client = createPublicClient({ transport: http(RPC_URL) });
          scwAddress = await client.readContract({
            address: FACTORY_ADDRESS,
            abi: factoryAbi,
            functionName: 'getAddress',
            args: [BigInt(pubKeyX), BigInt(pubKeyY), BigInt(salt)],
          });
        }
      }

      if (!scwAddress) throw new Error('無法計算 SCW 地址 (請確認 Factory Address 設定)');

      // 4. 更新後端資料庫
      // ：這裡假設後端 /api/v1/secure/me (PATCH) 已經更新為支援 blockchainAddress
      // 如果尚未更新，這裡可能會失敗或無效。建議同步確認後端 API。
      const dewt = localStorage.getItem('dewt');
      const updateRes = await fetch(`${origin}${routes.auth.me()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dewt}` },
        body: JSON.stringify({
          blockchainAddress: scwAddress,
        }),
      });

      if (!updateRes.ok)
        console.warn('Backend update might have failed, but SCW address is calculated.');

      setKeyStatus(`✅ 錢包初始化成功！地址: ${scwAddress} (請重新登入以生效)`);
      await refetchUser();
    } catch (err: unknown) {
      setError((err as Error).message || '初始化失敗');
    } finally {
      setIsKeyLoading(false);
    }
  };

  // Info: (20251128 - Tzuhan) 測試 SCW 簽名 (證明擁有權)
  const handleTestSignature = async () => {
    setIsKeyLoading(true);
    setKeyStatus('請驗證您的 Passkey...');
    setError(null);
    try {
      const challenge = bufferToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
      const options: AuthenticateOptions = {
        challenge,
        userVerification: 'required',
      };
      await fido2ClientService.startLogin(options);
      setKeyStatus('✅ 簽名驗證成功！您擁有此錢包的控制權。');
    } catch (err: unknown) {
      setError((err as Error).message);
      setKeyStatus('驗證失敗');
    } finally {
      setIsKeyLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) router.replace(BM_URL.LOGIN);
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || !user) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center p-4">
        <p className="animate-pulse text-gray-500">正在載入使用者資料...</p>
      </div>
    );
  }

  const blockchainSection = (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">區塊鏈身分 (SCW)</h2>
      <div className="mt-6 border-t border-gray-200 pt-6">
        {user.blockchainAddress ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-500">您的智能合約錢包地址</p>
              <p className="break-all font-mono text-lg font-bold text-green-600">
                {user.blockchainAddress}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Info: (20251128 - Tzuhan) 測試簽名按鈕 */}
              <button
                onClick={handleTestSignature}
                disabled={isKeyLoading}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isKeyLoading ? '驗證中...' : 'Test SCW Signature'}
              </button>

              {/* Info: (20251128 - Tzuhan) 管理裝置按鈕 */}
              <Link href={BM_URL.ADD_DEVICE} className="w-full">
                <button className="w-full rounded-lg bg-gray-800 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-gray-900">
                  新增裝置 (Add Device)
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              您尚未初始化區塊鏈錢包。請點擊下方按鈕來綁定您的 Passkey 並生成錢包地址。
            </p>
            <button
              onClick={handleInitializeWallet}
              disabled={isKeyLoading}
              className="w-full rounded-lg bg-purple-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isKeyLoading ? '初始化中...' : 'Initialize Wallet'}
            </button>
          </div>
        )}

        {(keyStatus || error) && (
          <div
            className={`mt-4 rounded-lg p-4 ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
          >
            <p className="text-sm font-medium">{error ? `Error: ${error}` : keyStatus}</p>
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
        <div className="z-10 flex w-full items-center justify-between px-16px py-20px">
          <Link href={BM_URL.BUSINESS_MONITOR}>
            <button type="button" className="p-10px text-text-primary">
              <FaChartBar size={24} />
            </button>
          </Link>
          <button type="button" onClick={handleLogout} className="p-10px text-text-primary">
            <PiSignOut size={24} />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-start gap-24px pt-20px">
          <div className="relative flex flex-col items-center">
            <div className="size-180px overflow-hidden rounded-full border-4 border-white shadow-md">
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
          <h2 className="text-h5 font-bold">{user.name ?? '-'}</h2>

          {/* Info: (20251128 - Tzuhan) 插入區塊鏈錢包區塊 */}
          <div className="w-full max-w-2xl px-4 pb-20">{blockchainSection}</div>
        </div>
      </div>
    </div>
  );

  const displayedTab =
    currentTab === ProfileTab.MY_ID ? (
      displayedProfileTab
    ) : currentTab === ProfileTab.MESSAGE ? (
      <ProfileMessageTab />
    ) : currentTab === ProfileTab.ACCESS ? (
      <ProfileAccessTab />
    ) : (
      <ProfileSettingTab />
    );

  return (
    <div className={`${bgColor} relative flex min-h-[dvh] w-full grow flex-col items-center`}>
      {displayedTab}
      {displayedNavbar}
      {isShowScanner && <QRCodeScanner onClose={toggleScanner} />}
    </div>
  );
}
