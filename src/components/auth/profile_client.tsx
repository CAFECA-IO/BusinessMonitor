'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  FaChartBar,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaMobileAlt,
  FaTrash,
} from 'react-icons/fa';
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
import {
  parsePublicKeyCoordinates,
  convertCoordsToKey,
  extractXYFromSPKI,
} from '@/lib/fido2-parse';
import { packWebAuthnSignature } from '@/lib/webauthn-utils';
import { getInitCode } from '@/lib/aa-utils';
import { UserOperation, UserOperationJson, BundlerResponse } from '@/validators';
import { encodeAbiParameters, keccak256, type Address, type Hex, encodeFunctionData } from 'viem';
import { getPusherInstance } from '@/lib/pusher_client';
import type { IApiResponse } from '@/lib/response';
import type { RegisterOptions } from '@passwordless-id/webauthn/dist/esm/types';
import { IAuthenticator, IExtendedUser } from '@/interfaces/auth';
import { toBigInt } from '@/lib/common';
import { logger } from '@/lib/logger';
import { publicClient } from '@/lib/viem';
import { ORIGIN, CONTRACT_ADDRESSES, ABIS } from '@/config/contracts';

if (!ORIGIN) {
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
  const [devices, setDevices] = useState<IAuthenticator[]>([]);
  const [isScwDeployed, setIsScwDeployed] = useState<boolean>(false);

  const router = useRouter();
  const { user: authUser, isLoading: isAuthLoading, logout, refetchUser } = useAuth();

  const user = authUser as IExtendedUser | null;

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

  // Info: (20251203 - Tzuhan) 1. 載入裝置列表與檢查部署狀態
  useEffect(() => {
    if (user?.authenticators) {
      setDevices(user.authenticators.map((d) => ({ ...d, verificationStatus: 'idle' })));
    }

    // Info: (20251203 - Tzuhan) [PoC 4 UX] 檢查合約是否已部署
    const checkDeploymentStatus = async () => {
      if (user?.blockchainAddress) {
        try {
          const client = publicClient;
          const code = await client.getCode({ address: user.blockchainAddress as Address });
          // Info: (20251203 - Tzuhan) 如果 code 存在且不為 0x，代表已部署
          setIsScwDeployed(code !== undefined && code !== '0x');
        } catch (e) {
          console.warn('Failed to check SCW status', e);
        }
      }
    };
    checkDeploymentStatus();
  }, [user]);

  // Info: (20251203 - Tzuhan) 2. Pusher 即時監聽 (監聽用戶個人頻道)
  useEffect(() => {
    if (!user?.id) return;
    const pusher = getPusherInstance();
    const channelName = `private-user-${user.id}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('user-updated', () => {
      console.log('User updated event received, refreshing...');
      refetchUser();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [user?.id, refetchUser]);

  // Info: (20251203 - Tzuhan) 3. 驗證裝置是否在鏈上
  const handleVerifyDeviceOnChain = async (index: number) => {
    const device = devices[index];
    if (!user?.blockchainAddress || !device.credentialPublicKey) return;

    const newDevices = [...devices];
    newDevices[index].verificationStatus = 'loading';
    setDevices(newDevices);

    try {
      // Info: (20251204 - Tzuhan) [Fix] 非同步取得座標
      const keys = extractXYFromSPKI(device.credentialPublicKey);
      if (!keys) throw new Error('Invalid Public Key Format');

      const encoded = encodeAbiParameters(
        [{ type: 'uint256' }, { type: 'uint256' }],
        [keys.x, keys.y]
      );
      const hash = keccak256(encoded);

      console.log(`Verifying Key on SCW ${user.blockchainAddress}`, {
        x: keys.x,
        y: keys.y,
        hash,
      });

      const client = publicClient;
      const isAuthorized = await client.readContract({
        address: user.blockchainAddress as Address,
        abi: ABIS.SCW,
        functionName: 'signers',
        args: [hash],
      });

      newDevices[index].verificationStatus = isAuthorized ? 'verified' : 'failed';
      setDevices([...newDevices]);
    } catch (e) {
      console.error('Verification error:', e);
      // Info: (20251203 - Tzuhan) 如果報錯是因為合約未部署，我們可以視為「未授權」或特別標示
      newDevices[index].verificationStatus = 'failed';
      setDevices([...newDevices]);
    }
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

      // Info: (20251128 - Tzuhan) 3. 計算 SCW 地址 & 轉換金鑰格式
      let scwAddress = '';
      let pubKeyXStr = '';
      let pubKeyYStr = '';
      const salt = '0';
      let publicKeyString = '';

      if (CONTRACT_ADDRESSES.FACTORY) {
        const coords = parsePublicKeyCoordinates(credential.response.attestationObject);
        if (coords) {
          // Info: (20251205 - Tzuhan) A. 轉為 BigInt 字串供合約計算地址
          const pubKeyX = toBigInt(coords.x);
          const pubKeyY = toBigInt(coords.y);
          pubKeyXStr = pubKeyX.toString();
          pubKeyYStr = pubKeyY.toString();
          publicKeyString = await convertCoordsToKey(pubKeyXStr, pubKeyYStr);

          const client = publicClient;
          scwAddress = await client.readContract({
            address: CONTRACT_ADDRESSES.FACTORY,
            abi: ABIS.FACTORY,
            functionName: 'getAddress',
            args: [pubKeyX, pubKeyY, BigInt(salt)],
          });
        }
      }

      if (!scwAddress) throw new Error('無法計算 SCW 地址');
      if (!publicKeyString) throw new Error('無法轉換公鑰格式');

      const dewt = localStorage.getItem('dewt');
      const updateRes = await fetch(`${origin}${routes.auth.me()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dewt}` },
        body: JSON.stringify({
          blockchainAddress: scwAddress,
          initPublicKey: { x: pubKeyXStr, y: pubKeyYStr },
          deploymentSalt: salt,
          newAuthenticator: {
            credentialID: credential.id,
            credentialPublicKey: publicKeyString,
            counter: 0,
            algorithm: 'ES256',
            userHandle: options.user.id,
            label: user.name || 'Initial Key (Wallet Owner)',
          },
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

  // Info: (20251203 - Tzuhan) 真實交易測試 (Lazy Deployment)
  const handleTestSignature = async () => {
    if (!user?.blockchainAddress) {
      setError('找不到錢包地址，請先初始化。');
      return;
    }
    if (!CONTRACT_ADDRESSES.FACTORY || !CONTRACT_ADDRESSES.ENTRY_POINT) {
      setError('系統設定錯誤：缺少合約地址。');
      return;
    }

    setIsKeyLoading(true);
    setKeyStatus('正在準備交易...');
    setError(null);

    try {
      const client = publicClient;
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

        initCode = getInitCode(
          CONTRACT_ADDRESSES.FACTORY,
          BigInt(initKey.x),
          BigInt(initKey.y),
          salt
        );
      } else {
        setKeyStatus('帳戶已部署，準備發送交易...');
        nonce = await client.readContract({
          address: CONTRACT_ADDRESSES.ENTRY_POINT,
          abi: ABIS.ENTRY_POINT,
          functionName: 'getNonce',
          args: [scwAddr, BigInt(0)],
        });
      }

      // Info: (20251128 - Tzuhan) 2. 建構 UserOp
      const unsignedUserOp: UserOperation = {
        sender: scwAddr,
        nonce,
        initCode,
        callData: '0x',
        callGasLimit: BigInt(100_000),
        verificationGasLimit: isDeployed ? BigInt(500_000) : BigInt(3_500_000),
        preVerificationGas: BigInt(100_000),
        maxFeePerGas: BigInt(0),
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
        address: CONTRACT_ADDRESSES.ENTRY_POINT,
        abi: ABIS.ENTRY_POINT,
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
          allowCredentials: [],
        },
      })) as PublicKeyCredential;

      const response = assertion.response as AuthenticatorAssertionResponse;

      /**
       * Info: (20251128 - Tzuhan) 這裡先暫時使用 initPublicKey 來簽署
       * 在多裝置情境下，應該要判斷 credentialID 對應哪把 key
       */
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
          entryPointAddress: CONTRACT_ADDRESSES.ENTRY_POINT,
        }),
      });

      const result: BundlerResponse = await res.json();

      if (result.payload?.transactionHash && result.payload?.status === 'success') {
        setKeyStatus(`✅ 交易成功！(Tx: ${result.payload.transactionHash.slice(0, 8)}...)`);
        setIsScwDeployed(true);
        if (!isDeployed) await refetchUser();
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

  // Info: (20251204 - Tzuhan) 4. [PoC 4] 移除裝置 (發送 removeSigner 交易)
  const handleRemoveDevice = async (device: IAuthenticator) => {
    if (!confirm(`確定要移除裝置 "${device.label}" 嗎？這將發送區塊鏈交易。`)) return;
    if (!user?.blockchainAddress) return;

    setIsKeyLoading(true);
    setKeyStatus('正在準備移除裝置...');
    setError(null);

    try {
      // Info: (20251204 - Tzuhan) A. 解析要移除的目標公鑰
      const targetKeys = extractXYFromSPKI(device.credentialPublicKey);
      logger.info(
        `Removing device with keys: X=${targetKeys?.x}, Y=${targetKeys?.y}, pubKey=${device.credentialPublicKey}`
      );
      if (!targetKeys) throw new Error('無法解析目標裝置公鑰');

      const client = publicClient;
      const scwAddr = user.blockchainAddress as Address;

      // Info: (20251204 - Tzuhan) B. 建構 UserOp: removeSigner
      const innerCallData = encodeFunctionData({
        abi: ABIS.SCW,
        functionName: 'removeSigner',
        args: [targetKeys.x, targetKeys.y],
      });

      const userOpCallData = encodeFunctionData({
        abi: ABIS.SCW,
        functionName: 'execute',
        args: [scwAddr, BigInt(0), innerCallData],
      });

      const nonce = await client.readContract({
        address: CONTRACT_ADDRESSES.ENTRY_POINT,
        abi: ABIS.ENTRY_POINT,
        functionName: 'getNonce',
        args: [scwAddr, BigInt(0)],
      });

      const userOp: UserOperation = {
        sender: scwAddr,
        nonce,
        initCode: '0x',
        callData: userOpCallData,
        callGasLimit: BigInt(100_000),
        verificationGasLimit: BigInt(500_000),
        preVerificationGas: BigInt(50_000),
        maxFeePerGas: BigInt(0),
        maxPriorityFeePerGas: BigInt(0),
        paymasterAndData: '0x',
        signature: '0x',
      };

      // Info: (20251204 - Tzuhan) C. 計算 Hash 並簽名 (使用當前操作的裝置)
      const userOpTuple = {
        ...userOp,
        sender: scwAddr as `0x${string}`,
        initCode: userOp.initCode as `0x${string}`,
        callData: userOp.callData as `0x${string}`,
        paymasterAndData: userOp.paymasterAndData as `0x${string}`,
        signature: userOp.signature as `0x${string}`,
      };
      const userOpHash = await client.readContract({
        address: CONTRACT_ADDRESSES.ENTRY_POINT,
        abi: ABIS.ENTRY_POINT,
        functionName: 'getUserOpHash',
        args: [userOpTuple],
      });

      setKeyStatus('請使用您的 Passkey (FaceID/指紋) 確認移除...');
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: Buffer.from(userOpHash.slice(2), 'hex'),
          rpId: window.location.hostname,
          userVerification: 'required',
          allowCredentials: [],
        },
      })) as PublicKeyCredential;

      const response = assertion.response as AuthenticatorAssertionResponse;
      logger.info(`Assertion obtained =${JSON.stringify(assertion)}`);

      // Info: (20251205 - Tzuhan) (20251204 - Tzuhan) 取得當前簽名者的公鑰
      let signerX = BigInt(0);
      let signerY = BigInt(0);

      const currentCredId = assertion.id;
      const currentAuth = user.authenticators?.find((a) => a.credentialID === currentCredId);
      logger.info(`Current signing device credential ID: ${currentCredId}`);
      logger.info(`user.authenticators = ${JSON.stringify(user.authenticators)}`);

      if (currentAuth) {
        const keys = extractXYFromSPKI(currentAuth.credentialPublicKey);
        logger.info(`Current signing device keys: X=${keys?.x}, Y=${keys?.y}`);
        if (keys) {
          signerX = keys.x;
          signerY = keys.y;
        }
      } else {
        // Info: (20251205 - Tzuhan) Fallback to initKey
        const initKey = user.initPublicKey as { x: string; y: string };
        logger.info(`Fallback to initKey: X=${initKey?.x}, Y=${initKey?.y}`);
        if (initKey) {
          signerX = BigInt(initKey.x);
          signerY = BigInt(initKey.y);
        }
      }

      if (signerX === BigInt(0)) throw new Error('無法識別當前簽名裝置，請重試');

      const packedSignature = packWebAuthnSignature(
        new Uint8Array(response.authenticatorData),
        new TextDecoder().decode(response.clientDataJSON),
        new Uint8Array(response.signature),
        signerX,
        signerY
      );

      // Info: (20251204 - Tzuhan) D. 發送交易
      setKeyStatus('正在提交移除請求...');
      const signedUserOpJson: UserOperationJson = {
        ...userOp,
        nonce: `0x${userOp.nonce.toString(16)}`,
        callGasLimit: `0x${userOp.callGasLimit.toString(16)}`,
        verificationGasLimit: `0x${userOp.verificationGasLimit.toString(16)}`,
        preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
        maxFeePerGas: `0x${userOp.maxFeePerGas.toString(16)}`,
        maxPriorityFeePerGas: `0x${userOp.maxPriorityFeePerGas.toString(16)}`,
        signature: packedSignature,
      };

      setKeyStatus('正在提交移除請求 (雙重刪除)...');

      const dewt = localStorage.getItem('dewt');

      const res = await fetch(routes.auth.authenticators.remove(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dewt}` },
        body: JSON.stringify({
          userOp: signedUserOpJson,
          entryPointAddress: CONTRACT_ADDRESSES.ENTRY_POINT,
          authenticatorId: device.id,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setKeyStatus(`✅ 移除成功！(Tx: ${result.payload.transactionHash.slice(0, 8)}...)`);
        await refetchUser();
      } else {
        throw new Error(result.message || result.payload?.details || '交易失敗');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
      setKeyStatus('❌ 移除失敗');
    } finally {
      setIsKeyLoading(false);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center p-4">
        <p className="animate-pulse text-gray-500">正在載入使用者資料...</p>
      </div>
    );
  }

  const deviceListSection = (
    <div className="mt-8 w-full">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
        <FiMonitor /> 已綁定裝置 (Devices)
      </h3>
      <div className="space-y-3">
        {devices.length === 0 && <p className="text-sm text-gray-500">尚無裝置</p>}
        {devices.map((device, idx) => (
          <div
            key={device.id}
            className="flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white p-2 text-blue-500 shadow-sm">
                <FaMobileAlt />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{device.label || `Device ${idx + 1}`}</p>
                <p className="text-xs text-gray-500">
                  Added: {new Date(device.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-1 w-32 truncate font-mono text-[10px] text-gray-400 sm:w-48">
                  Key: {device.credentialPublicKey.slice(0, 20)}...
                </p>
              </div>
            </div>
            <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
              {device.verificationStatus === 'verified' && (
                <span className="flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-bold text-green-600">
                  <FaCheckCircle /> On-Chain
                </span>
              )}
              {device.verificationStatus === 'failed' && (
                <span className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-600">
                  <FaTimesCircle /> Unauthorized
                </span>
              )}
              <button
                onClick={() => handleVerifyDeviceOnChain(idx)}
                disabled={device.verificationStatus === 'loading'}
                className="flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-100 disabled:opacity-50"
              >
                {device.verificationStatus === 'loading' && <FaSpinner className="animate-spin" />}{' '}
                Check
              </button>
              <button
                onClick={() => handleRemoveDevice(device)}
                disabled={isKeyLoading}
                className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                <FaTrash /> 移除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const blockchainSection = (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
        <LuIdCard className="text-purple-600" /> 區塊鏈身分 (SCW)
      </h2>
      <div className="mt-6 border-t border-gray-200 pt-6">
        {user.blockchainAddress ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-500">您的智能合約錢包地址</p>
              <div className="flex items-center gap-3">
                <p className="break-all rounded border border-green-100 bg-green-50 p-2 font-mono text-lg font-bold text-green-600">
                  {user.blockchainAddress}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${isScwDeployed ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}
                >
                  {isScwDeployed ? '已啟用 (Active)' : '待啟用 (Pending)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={handleTestSignature}
                disabled={isKeyLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-base font-semibold text-white shadow-sm disabled:bg-gray-400 ${
                  isScwDeployed
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isKeyLoading ? <FaSpinner className="animate-spin" /> : null}
                {isKeyLoading
                  ? '處理中...'
                  : isScwDeployed
                    ? '發送測試交易 (Sign)'
                    : '啟用錢包 (Activate Wallet)'}
              </button>

              <Link href={BM_URL.ADD_DEVICE} className="w-full">
                <button className="w-full rounded-lg bg-gray-800 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-gray-900">
                  新增裝置 (Add Device)
                </button>
              </Link>
            </div>

            {deviceListSection}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4">
              <p className="font-medium text-gray-700">您尚未初始化區塊鏈錢包。</p>
              <p className="mt-1 text-sm text-gray-500">
                點擊下方按鈕，系統將為您自動部署一個專屬的智能合約錢包 (Gasless)。
              </p>
            </div>
            <button
              onClick={handleInitializeWallet}
              disabled={isKeyLoading}
              className="w-full rounded-lg bg-purple-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isKeyLoading ? '初始化中...' : '立即初始化'}
            </button>
          </div>
        )}

        {(keyStatus || error) && (
          <div
            className={`mt-4 rounded-lg p-4 ${error ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}
          >
            <p className="text-sm font-medium">{error ? `Error: ${error}` : keyStatus}</p>
          </div>
        )}
      </div>
    </div>
  );

  const displayedNavbar = (
    <div className="grid w-full grid-cols-5 gap-8px rounded-t-radius-s bg-white px-16px pb-16px pt-8px shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <button
        type="button"
        onClick={myIdClickHandler}
        className="flex flex-col items-center gap-4px px-8px py-4px"
      >
        <LuIdCard size={24} className={myIdTextColor} />
        <p className={`text-xs font-medium ${myIdTextColor}`}>My ID</p>
      </button>
      <button
        type="button"
        onClick={messageClickHandler}
        className="flex flex-col items-center gap-4px px-8px py-4px"
      >
        <IoChatbubbleEllipsesOutline size={24} className={messageTextColor} />
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
        <FiMonitor size={24} className={accessTextColor} />
        <p className={`text-xs font-medium ${accessTextColor}`}>Access</p>
      </button>
      <button
        type="button"
        onClick={settingClickHandler}
        className="flex flex-col items-center gap-4px px-8px py-4px"
      >
        <LuSettings size={24} className={settingTextColor} />
        <p className={`text-xs font-medium ${settingTextColor}`}>Setting</p>
      </button>
    </div>
  );

  const displayedProfileTab = (
    <div className="relative w-full flex-1 overflow-y-auto pb-20">
      <div className="absolute z-0 h-80 w-full">
        <Image
          src="/elements/profile_cover.svg"
          fill
          className="object-cover object-bottom"
          alt="wave_shape_cover"
        />
      </div>

      <div className="flex min-h-full flex-col">
        <div className="z-10 flex w-full items-center justify-between px-16px py-20px">
          <Link href={BM_URL.BUSINESS_MONITOR}>
            <button type="button" className="p-10px text-white transition hover:text-gray-200">
              <FaChartBar size={24} />
            </button>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="p-10px text-white transition hover:text-gray-200"
          >
            <PiSignOut size={24} />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-start gap-24px px-4 pt-20px">
          <div className="relative flex flex-col items-center">
            <div className="size-180px overflow-hidden rounded-full border-4 border-white bg-white shadow-md">
              <Image
                src={user.photo ?? DEFAULT_USER_AVATAR}
                width={183}
                height={183}
                alt="user_avatar"
                className="object-cover"
              />
            </div>
            <div className="-translate-y-10px rounded-radius-s bg-surface-brand px-12px py-6px text-sm font-medium text-text-invert shadow-sm">
              {userTitle}
            </div>
          </div>
          <h2 className="text-h5 font-bold text-gray-800">{user.name ?? 'Anonymous'}</h2>

          {/* Info: (20251203 - Tzuhan) SCW Block */}
          <div className="w-full max-w-2xl">{blockchainSection}</div>
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
      <ProfileAccessTab devices={devices} handleRemoveDevice={handleRemoveDevice} />
    ) : (
      <ProfileSettingTab />
    );

  return (
    <div className={`${bgColor} relative flex h-screen w-full flex-col overflow-hidden`}>
      {displayedTab}
      <div className="absolute bottom-0 z-50 w-full">{displayedNavbar}</div>
      {isShowScanner && <QRCodeScanner onClose={toggleScanner} />}
    </div>
  );
}
