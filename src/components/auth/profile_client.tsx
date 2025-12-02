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
import { fido2ClientService } from '@/lib/fido2-client';
import { parsePublicKeyCoordinates } from '@/lib/fido2-parse';
import { packWebAuthnSignature } from '@/lib/webauthn-utils';
import { getInitCode } from '@/lib/aa-utils';
import { UserOperation, UserOperationJson, BundlerResponse } from '@/validators';
import { createPublicClient, http, parseAbi, type Address, type Hex } from 'viem';
import type { IApiResponse } from '@/lib/response';
import type { RegisterOptions } from '@passwordless-id/webauthn/dist/esm/types';
import { RPC_URL } from '@/constants/config';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_SCW_FACTORY_ADDRESS || '') as Address;
const ENTRY_POINT_ADDRESS = (process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS || '') as Address;

const factoryAbi = parseAbi([
  'function getAddress(uint256 pubKeyX, uint256 pubKeyY, uint256 salt) external view returns (address)',
]);

const entryPointAbi = parseAbi([
  'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)',
  'function getUserOpHash((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp) external view returns (bytes32)',
]);

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
      let pubKeyXStr = '';
      let pubKeyYStr = '';
      const salt = '0';

      if (FACTORY_ADDRESS) {
        const coords = parsePublicKeyCoordinates(credential.response.attestationObject);
        if (coords) {
          const pubKeyX = toBigInt(coords.x);
          const pubKeyY = toBigInt(coords.y);
          pubKeyXStr = pubKeyX.toString();
          pubKeyYStr = pubKeyY.toString();

          const client = createPublicClient({ transport: http(RPC_URL) });
          scwAddress = await client.readContract({
            address: FACTORY_ADDRESS,
            abi: factoryAbi,
            functionName: 'getAddress',
            args: [pubKeyX, pubKeyY, BigInt(salt)],
          });
        }
      }

      if (!scwAddress) throw new Error('無法計算 SCW 地址');

      const dewt = localStorage.getItem('dewt');
      // Info: (20251128 - Tzuhan) 呼叫 PATCH /me 更新用戶資料
      const updateRes = await fetch(`${origin}${routes.auth.me()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dewt}` },
        body: JSON.stringify({
          blockchainAddress: scwAddress,
          initPublicKey: { x: pubKeyXStr, y: pubKeyYStr },
          deploymentSalt: salt,
        }),
      });

      if (!updateRes.ok) throw new Error('更新資料庫失敗');

      setKeyStatus(`✅ 錢包初始化成功！地址: ${scwAddress}`);
      await refetchUser();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '發生未知錯誤';
      setError(message);
    } finally {
      setIsKeyLoading(false);
    }
  };

  // Info: (20251128 - Tzuhan) 真實交易測試 (包含 Lazy Deployment 與 簽名驗證)
  const handleTestSignature = async () => {
    if (!user?.blockchainAddress) {
      setError('找不到錢包地址，請先初始化。');
      return;
    }
    if (!FACTORY_ADDRESS || !ENTRY_POINT_ADDRESS) {
      setError('系統設定錯誤：缺少合約地址。');
      return;
    }

    setIsKeyLoading(true);
    setKeyStatus('正在準備交易...');
    setError(null);

    try {
      const client = createPublicClient({ transport: http(RPC_URL) });
      const scwAddr = user.blockchainAddress as Address;

      // Info: (20251128 - Tzuhan) 1. 檢查合約狀態 (Lazy Deployment)
      const code = await client.getBytecode({ address: scwAddr });
      const isDeployed = code !== undefined && code !== '0x';

      let initCode: Hex = '0x';
      let nonce = BigInt(0);

      if (!isDeployed) {
        setKeyStatus('偵測到新帳戶，準備執行自動部署...');
        const initKey = user.initPublicKey as { x: string; y: string } | null;
        const salt = user.deploymentSalt ? BigInt(user.deploymentSalt) : BigInt(0);

        if (!initKey || !initKey.x || !initKey.y) {
          throw new Error('無法取得初始化公鑰，請重新初始化錢包。');
        }

        initCode = getInitCode(FACTORY_ADDRESS, BigInt(initKey.x), BigInt(initKey.y), salt);
      } else {
        setKeyStatus('帳戶已部署，準備發送交易...');
        nonce = await client.readContract({
          address: ENTRY_POINT_ADDRESS,
          abi: entryPointAbi,
          functionName: 'getNonce',
          args: [scwAddr, BigInt(0)],
        });
      }

      // Info: (20251128 - Tzuhan) 2. 建構 UserOp
      const unsignedUserOp: UserOperation = {
        sender: scwAddr,
        nonce,
        initCode,
        callData: '0x', // Info: (20251128 - Tzuhan) 空操作測試
        callGasLimit: BigInt(100_000),
        verificationGasLimit: isDeployed ? BigInt(500_000) : BigInt(2_000_000), // Info: (20251128 - Tzuhan) 部署需要較多 Gas
        preVerificationGas: BigInt(50_000),
        maxFeePerGas: BigInt(0), // Info: (20251128 - Tzuhan) Gasless: Relayer 全額買單
        maxPriorityFeePerGas: BigInt(0),
        paymasterAndData: '0x',
        signature: '0x',
      };

      // Info: (20251128 - Tzuhan) 3. 計算 Hash (Challenge)
      const userOpTuple = {
        ...unsignedUserOp,
        sender: scwAddr as `0x${string}`,
        initCode: initCode as `0x${string}`,
        callData: '0x' as `0x${string}`,
        paymasterAndData: '0x' as `0x${string}`,
        signature: '0x' as `0x${string}`,
      };
      const userOpHash = await client.readContract({
        address: ENTRY_POINT_ADDRESS,
        abi: entryPointAbi,
        functionName: 'getUserOpHash',
        args: [userOpTuple],
      });

      // Info: (20251128 - Tzuhan) 4. 喚起 Passkey 簽名
      setKeyStatus('請使用您的 Passkey (FaceID/指紋) 簽署交易...');

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: Buffer.from(userOpHash.slice(2), 'hex'),
          rpId: window.location.hostname,
          userVerification: 'required',
          allowCredentials: [], // Info: (20251128 - Tzuhan) 允許使用任意註冊過的 Passkey
        },
      })) as PublicKeyCredential;

      const response = assertion.response as AuthenticatorAssertionResponse;

      // Info: (20251128 - Tzuhan) 這裡需要公鑰來打包簽名。
      // Info: (20251128 - Tzuhan) 如果是新部署，用 initPublicKey。
      // Info: (20251128 - Tzuhan) 如果是已部署，理想上應從合約讀取或由用戶選擇，這裡簡化為使用 initPublicKey (假設是同一把鑰匙)
      // Info: (20251128 - Tzuhan) 如果是 Multi-Signer 情境，這裡就需要更複雜的邏輯來決定用哪把公鑰打包
      const initKey = user.initPublicKey as { x: string; y: string };

      const packedSignature = packWebAuthnSignature(
        new Uint8Array(response.authenticatorData),
        new TextDecoder().decode(response.clientDataJSON),
        new Uint8Array(response.signature),
        BigInt(initKey.x),
        BigInt(initKey.y)
      );

      // Info: (20251128 - Tzuhan) 5. 發送給 Bundler
      setKeyStatus('正在提交交易至區塊鏈...');
      const signedUserOpJson: UserOperationJson = {
        ...unsignedUserOp,
        nonce: `0x${unsignedUserOp.nonce.toString(16)}`,
        callGasLimit: `0x${unsignedUserOp.callGasLimit.toString(16)}`,
        verificationGasLimit: `0x${unsignedUserOp.verificationGasLimit.toString(16)}`,
        preVerificationGas: `0x${unsignedUserOp.preVerificationGas.toString(16)}`,
        maxFeePerGas: `0x${unsignedUserOp.maxFeePerGas.toString(16)}`,
        maxPriorityFeePerGas: `0x${unsignedUserOp.maxPriorityFeePerGas.toString(16)}`,
        signature: packedSignature,
      };

      const res = await fetch('/api/v1/bundler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userOp: signedUserOpJson,
          entryPointAddress: ENTRY_POINT_ADDRESS,
        }),
      });

      const result: BundlerResponse = await res.json();

      if (result.payload?.transactionHash && result.payload?.status === 'success') {
        setKeyStatus(`✅ 交易成功！(Tx: ${result.payload.transactionHash})`);
        // Info: (20251128 - Tzuhan) 如果是第一次部署，重新整理用戶資料以更新狀態
        if (!isDeployed) {
          await refetchUser();
        }
      } else {
        throw new Error(result.payload?.error || '交易失敗');
      }
    } catch (err: unknown) {
      setError((err as Error).message || '驗證失敗');
      setKeyStatus('❌ 交易失敗');
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
                {isKeyLoading ? '處理中...' : '發送測試交易 (上鏈驗證)'}
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
              {isKeyLoading ? '初始化中...' : '初始化錢包 (Initialize SCW)'}
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
