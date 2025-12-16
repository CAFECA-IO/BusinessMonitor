'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUserLarge } from 'react-icons/fa6';
import { FiUpload } from 'react-icons/fi';
import { GiPerspectiveDiceSixFacesOne } from 'react-icons/gi';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api_routes';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import Button from '@/components/common/button';

// Info: (20251128 - Tzuhan) 引入新依賴
import { parsePublicKeyCoordinates } from '@/lib/fido2-parse';

import { publicClient } from '@/lib/viem';
import { ORIGIN, CONTRACT_ADDRESSES, ABIS } from '@/config/contracts';
import { toBigInt } from '@/lib/common';

if (!ORIGIN) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

export default function SignupClient() {
  // ToDo: (20251016 - Julian) Default avatar image path
  const defaultAvatar = 'https://avatar.cafeca.io/api/v1/avatar/$avatar_id';

  const [name, setName] = useState<string>('');
  const [isNameValid, setIsNameValid] = useState<boolean>(true);
  const [avatarUrl, setAvatarUrl] = useState<string>(defaultAvatar);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [randomBtnLoading, setRandomBtnLoading] = useState<boolean>(false);
  const [agreed, setAgreed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState('請輸入您的資訊以建立 Digital ID。');
  const [error, setError] = useState<string | null>(null);
  const [isFidoAvailable, setIsFidoAvailable] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Info: (20251016 - Julian) 只允許英文字母 + 中文
  // const namePattern = /^[A-Za-z\u4e00-\u9fa5_]+$/u;

  const router = useRouter();
  const { user, isLoading: isAuthLoading, login, refetchUser } = useAuth();

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (user) {
      router.push(BM_URL.PROFILE);
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (!fido2ClientService.isAvailable()) {
      setIsFidoAvailable(false);
      setStatusMessage('此環境不支援 Passkey 功能。');
      setError('請使用支援的瀏覽器並確保在安全的 HTTPS 環境下操作。');
    }
  }, []);

  const changeNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputName = e.target.value;
    setName(inputName);

    // const isValid = inputName.length > 0 ? namePattern.test(inputName.trim()) : true;
    const isValid = true; // Info: (20251016 - Julian) 先取消命名規則
    setIsNameValid(isValid);
  };

  const handleRegister = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setStatusMessage('正在準備註冊...');

    try {
      // Info: (20251008 - Tzuhan) 步驟 1: 從後端獲取註冊選項
      const optionsRes = await fetch(`${origin}${routes.auth.webauthn.options('register')}`);
      if (!optionsRes.ok) throw new Error('無法從伺服器獲取註冊選項。');
      const optionsResponse = await optionsRes.json();
      if (!optionsResponse.success) {
        throw new Error(optionsResponse.message || '無法從伺服器獲取註冊選項。');
      }
      const options = optionsResponse.payload;
      options.user.name = name;
      options.user.displayName = name;

      // Info: (20251008 - Tzuhan) 步驟 2: 啟動瀏覽器的 Passkey 註冊流程
      setStatusMessage('請依照瀏覽器提示，建立您的 Passkey...');
      const registration = await fido2ClientService.startRegistration(options);

      // -----------------------------------------------------------------------
      // Info: (20251128 - Tzuhan) 新增邏輯：計算 SCW 地址 (Lazy Deployment 準備)
      // -----------------------------------------------------------------------
      setStatusMessage('正在計算您的區塊鏈錢包地址...');
      let scwAddress = '';
      let pubKeyXStr = '';
      let pubKeyYStr = '';
      const salt = '0';

      if (CONTRACT_ADDRESSES.FACTORY) {
        try {
          const coords = parsePublicKeyCoordinates(registration.response.attestationObject);
          if (coords) {
            const pubKeyX = toBigInt(coords.x);
            const pubKeyY = toBigInt(coords.y);

            // Info: (20251128 - Tzuhan) 轉字串以便傳輸
            pubKeyXStr = pubKeyX.toString();
            pubKeyYStr = pubKeyY.toString();

            const client = publicClient;

            // Info: (20251128 - Tzuhan) 呼叫工廠預測地址
            const address = await client.readContract({
              address: CONTRACT_ADDRESSES.FACTORY,
              abi: ABIS.FACTORY,
              functionName: 'getAddress',
              args: [pubKeyX, pubKeyY, BigInt(salt)],
            });

            scwAddress = address;
            console.log(`[Signup] Calculated SCW Address: ${scwAddress}`);
          }
        } catch (calcErr) {
          console.warn('[Signup] Failed to calculate SCW address:', calcErr);
        }
      }

      // Info: (20251128 - Tzuhan) 步驟 3: 驗證 + 儲存 (夾帶 SCW 資料)
      setStatusMessage('正在驗證您的新 Passkey...');

      const verifyPayload = {
        ...registration,
        authenticatorLabel:
          `${registration.user.displayName || registration.user.name}'s Device` || 'Primary Device',
        // Info: (20251128 - Tzuhan) 額外欄位，後端需修改以接收這些資料
        scwData: scwAddress
          ? {
              address: scwAddress,
              initPublicKey: { x: pubKeyXStr, y: pubKeyYStr },
              deploymentSalt: salt,
            }
          : undefined,
      };

      const verifyRes = await fetch(`${origin}${routes.auth.webauthn.verify()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyPayload),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || '註冊驗證失敗。');
      }

      // Info: (20251008 - Tzuhan) 步驟 4: 註冊成功
      setStatusMessage('✅ 註冊成功！正在為您登入...');
      await login(verifyData.payload.dewt);

      if (uploadedAvatarUrl) {
        setStatusMessage('正在更新頭像...');
        try {
          const updateRes = await fetch(`${origin}${routes.auth.me()}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${verifyData.payload.dewt}`,
            },
            body: JSON.stringify({ photo: uploadedAvatarUrl }),
          });
          if (!updateRes.ok) console.warn('Avatar update failed.');
          else await refetchUser();
        } catch (updateErr) {
          console.warn('Error updating avatar:', updateErr);
        }
      }

      setTimeout(() => router.push(BM_URL.PROFILE), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤。';
      setStatusMessage(
        (err as Error).name === 'NotAllowedError' ? '您取消了註冊操作。' : '註冊失敗，請重試。'
      );
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [name, login, uploadedAvatarUrl, refetchUser, router]);

  const canSubmit = name.trim() !== '' && agreed && !isLoading && isFidoAvailable;
  const isSubmitDisabled = !(canSubmit && isNameValid);

  // ToDo: (20251016 - Julian) Random avatar function, need to replace with real avatar images
  const getRandomAvatar = () => {
    setRandomBtnLoading(true);
    const randomIndex = Math.floor(Math.random() * 10);
    setAvatarUrl(defaultAvatar.replace('$avatar_id', randomIndex.toString()));
    setTimeout(() => {
      setRandomBtnLoading(false);
    }, 3000); // Info: (20251021 - Julian) 等待 3 秒再重啟按鈕
  };

  // ToDo: (20251016 - Julian) Upload photo function
  const uploadPhoto = () => {
    console.log('upload photo');
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setStatusMessage('正在上傳照片...');
    setUploadedAvatarUrl(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadApiUrl = `${origin}${routes.upload.file()}`;
      const response = await fetch(uploadApiUrl, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '照片上傳失敗。');
      }

      const newAvatarUrl = data.payload.url;
      if (!newAvatarUrl) throw new Error('Upload successful but response missing url.');

      setAvatarUrl(newAvatarUrl);
      setUploadedAvatarUrl(newAvatarUrl);
      setStatusMessage('照片上傳成功！');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤。';
      setError(errorMessage);
      setStatusMessage('照片上傳失敗，請重試。');
      setAvatarUrl(defaultAvatar);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  if (isAuthLoading || user) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center p-4">
        <p>正在驗證您的身份...</p>
      </div>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/png, image/jpeg, image/gif"
        disabled={isUploading}
        aria-label="Upload your avatar photo"
      />
      <div className="absolute top-0 z-0 h-300px w-full">
        <Image
          src="/elements/signup_bg.svg"
          alt="signup_bg"
          fill
          objectFit="cover"
          objectPosition="bottom"
        />
      </div>

      <div className="z-10 flex flex-1 flex-col items-center justify-center px-24px py-32px">
        <h1 className="text-h5 font-bold text-text-invert">Create Your Digital ID</h1>

        <div className="mt-40px flex flex-col items-center gap-20px">
          <div className="relative">
            <div className="relative size-150px overflow-hidden rounded-full">
              <Image src={avatarUrl} fill objectFit="contain" alt="new_avatar" />
            </div>
            <div className="absolute bottom-0 right-0">
              <Button
                type="button"
                size="icon"
                className="rounded-full bg-button-secondary p-10px"
                onClick={getRandomAvatar}
                disabled={randomBtnLoading}
              >
                <GiPerspectiveDiceSixFacesOne size={24} />
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="primaryBorderless"
            className="mt-10px gap-8px"
            onClick={uploadPhoto}
            disabled={isUploading}
          >
            <FiUpload size={16} />
            <p>{isUploading ? '上傳中...' : 'Upload My Photo'}</p>
          </Button>
        </div>

        <div className="mt-40px flex flex-col gap-4px font-normal">
          <div
            className={`${
              isNameValid ? 'border-border-secondary' : 'border-border-error'
            } flex min-w-300px items-center gap-8px rounded-radius-s border bg-surface-primary p-spacing-2xs text-base`}
          >
            <FaUserLarge size={18} className={isNameValid ? 'text-text-note' : 'text-text-error'} />
            <input
              type="text"
              id="name"
              aria-labelledby="name-label"
              value={name}
              onChange={changeNameInput}
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-note focus:outline-none"
              placeholder="Enter your full legal name"
              disabled={isLoading}
            />
          </div>
          {!isNameValid && (
            <p className="text-sm text-text-error">No numbers or symbols, e.g. 123, @, #, !</p>
          )}
        </div>

        <div className="mt-32px flex flex-1 items-end">
          <div className="flex items-start gap-8px font-normal">
            <input
              id="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="size-24px shrink-0 appearance-none rounded-radius-xs border border-border-brand bg-surface-primary after:mx-auto after:hidden after:content-[url(/icons/checkmark.svg)] checked:after:block disabled:border-border-error"
              disabled={isLoading || !isNameValid}
              aria-labelledby="terms-label"
            />
            <label htmlFor="terms" className="flex flex-wrap items-center text-base">
              <p>I have read and agree to the</p>
              <Button type="button" variant="primaryBorderless" size="small">
                Terms of Service
              </Button>
              <p>and</p>
              <Button type="button" variant="primaryBorderless" size="small">
                Privacy Policy
              </Button>
            </label>
          </div>
        </div>

        <div className="mt-10px flex flex-col items-center gap-8px">
          <Button
            type="button"
            onClick={handleRegister}
            disabled={isSubmitDisabled}
            size="extraLarge"
          >
            {isLoading ? '處理中...' : 'Register & Verify'}
          </Button>
          <Link href={BM_URL.LOGIN}>
            <Button type="button" variant="secondaryBorderless" size="extraLarge">
              Cancel
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mt-4 w-full max-w-md rounded-md bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}
        {statusMessage && isLoading && (
          <p className="mt-2 text-center text-sm text-gray-500">{statusMessage}</p>
        )}
      </div>
    </>
  );
}
