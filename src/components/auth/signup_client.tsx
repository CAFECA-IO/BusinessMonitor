'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUserLarge } from 'react-icons/fa6';
import { FiUpload } from 'react-icons/fi';
import { GiPerspectiveDiceSixFacesOne } from 'react-icons/gi';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import Button from '@/components/common/button';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

const StatusDisplay = ({ status, error }: { status: string; error: string | null }) => (
  <div className="mt-8 w-full rounded-lg border border-gray-200 bg-gray-50 p-6">
    <h3 className="text-lg font-semibold text-gray-800">處理狀態</h3>
    <p className="mt-2 text-gray-600">
      狀態: <span className="font-medium text-gray-900">{status}</span>
    </p>
    {error && (
      <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
        <p className="font-bold text-red-700">發生錯誤:</p>
        <p className="mt-1 break-words text-red-600">{error}</p>
      </div>
    )}
  </div>
);

export default function SignupClient() {
  const [name, setName] = useState<string>('');
  const [isNameValid, setIsNameValid] = useState<boolean>(true);
  const [avatarUrl, setAvatarUrl] = useState<string>('/fake_avatar/business_img_1.jpg');
  const [agreed, setAgreed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('請輸入您的資訊以建立 Digital ID。');
  const [error, setError] = useState<string | null>(null);
  const [isFidoAvailable, setIsFidoAvailable] = useState<boolean>(true);

  // Info: (20251016 - Julian) 名稱不得包含數字或特殊字元，如 123, @, #, !
  const namePattern = /^[\p{L} \-'.]+$/u;

  const router = useRouter();
  const { user, isLoading: isAuthLoading, login } = useAuth();

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

    const isValid = namePattern.test(inputName.trim());
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
      const options = await optionsRes.json();

      // Info: (20251008 - Tzuhan) 將使用者輸入的名稱加入到註冊選項中
      options.user.name = name;
      options.user.displayName = name;

      // Info: (20251008 - Tzuhan) 步驟 2: 啟動瀏覽器的 Passkey 註冊流程
      setStatusMessage('請依照瀏覽器提示，建立您的 Passkey...');
      const registration = await fido2ClientService.startRegistration(options);

      // Info: (20251008 - Tzuhan) 步驟 3: 將註冊結果傳送至後端進行驗證
      setStatusMessage('正在驗證您的新 Passkey...');
      const verifyRes = await fetch(`${origin}${routes.auth.webauthn.verify()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || '註冊驗證失敗。');
      }

      // Info: (20251008 - Tzuhan) 步驟 4: 註冊成功
      setStatusMessage('✅ 註冊成功！正在為您登入...');
      // localStorage.setItem('dewt', verifyData.payload.dewt);
      await login(verifyData.payload.dewt);
      // Info: (20251008 - Tzuhan) 提示使用者備份恢復金鑰
      // alert(`請務必備份您的恢復金鑰，它只會出現這一次：\n\n${verifyData.payload.backupKey}`); // Info: (20251009 - Tzuhan) Deprecated

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
  }, [name, router, login]);

  const canSubmit = name.trim() !== '' && agreed && !isLoading && isFidoAvailable;
  const isSubmitDisabled = !(canSubmit && isNameValid);

  // ToDo: (20251016 - Julian) Random avatar function
  const getRandomAvatar = () => {
    const avatars = [
      '/fake_avatar/business_img_1.jpg',
      '/fake_avatar/business_img_2.png',
      '/fake_avatar/business_img_3.jpg',
    ];
    const randomIndex = Math.floor(Math.random() * avatars.length);
    setAvatarUrl(avatars[randomIndex]);
  };

  // ToDo: (20251016 - Julian) Upload photo function
  const uploadPhoto = () => {
    console.log('upload photo');
  };

  if (isAuthLoading || user) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center p-4">
        <p>正在驗證您的身份...</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const original = (
    <div className="flex w-full grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 shadow-lg sm:p-12">
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            建立您的 Digital ID
          </h1>
          <p className="mt-2 text-gray-500">只需一步，即可擁有安全的去中心化身份</p>

          <div className="mt-10 w-full space-y-6 sm:max-w-sm">
            <div>
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                您的全名
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="name"
                  aria-labelledby="name-label"
                  value={name}
                  onChange={changeNameInput}
                  className="block w-full rounded-md border-0 px-3 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600"
                  placeholder="例如：王小明"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center gap-x-3">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="size-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                disabled={isLoading}
                aria-labelledby="terms-label"
              />
              <label htmlFor="terms" className="block text-sm leading-6 text-gray-900">
                我已閱讀並同意
                <Link href="/terms" className="ml-1 font-semibold text-purple-600 hover:underline">
                  服務條款
                </Link>
              </label>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <button
                onClick={handleRegister}
                disabled={!canSubmit}
                className="w-full rounded-lg bg-purple-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:scale-100"
              >
                {isLoading ? '處理中...' : '註冊並以 Passkey 驗證'}
              </button>
              <Link
                href={BM_URL.LOGIN}
                className="w-full rounded-lg bg-white px-5 py-3.5 text-center text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-transform hover:scale-105 hover:bg-gray-50"
              >
                取消
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 w-full">
          <StatusDisplay status={statusMessage} error={error} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Info: (20251016 - Julian) Wave shape background */}
      <div className="absolute top-0 z-0 h-300px w-full">
        <Image
          src="/elements/signup_bg.svg"
          alt="signup_bg"
          fill
          objectFit="cover"
          objectPosition="bottom"
        />
      </div>

      {/* Info: (20251016 - Julian) Main content */}
      <div className="z-10 flex flex-1 flex-col items-center justify-center px-24px py-32px">
        {/* Info: (20251016 - Julian) Title */}
        <h1 className="text-h5 font-bold text-text-invert">Create Your Digital ID</h1>

        {/* Info: (20251016 - Julian) Avatar part */}
        <div className="mt-60px flex flex-col items-center gap-20px">
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
              >
                <GiPerspectiveDiceSixFacesOne size={24} />
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="primaryBorderless"
            className="mt-20px gap-8px"
            onClick={uploadPhoto}
          >
            <FiUpload size={16} />
            <p>Upload My Photo</p>
          </Button>
        </div>

        {/* Info: (20251016 - Julian) Name input part */}
        <div className="mt-54px flex min-w-300px items-center gap-8px rounded-md border border-border-secondary bg-surface-primary p-spacing-2xs text-base font-normal">
          <FaUserLarge size={18} className={isNameValid ? 'text-text-note' : ''} />
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

        {/* Info: (20251016 - Julian) Terms checkbox part */}
        <div className="mt-auto flex items-center gap-8px font-normal">
          <input
            id="terms"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="size-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
            disabled={isLoading}
            aria-labelledby="terms-label"
          />
          <label htmlFor="terms">
            I have read and agree to the{' '}
            <Link
              href="/terms"
              className="text-button-link hover:cursor-pointer hover:text-button-primary-hover"
            >
              Terms of Service{' '}
            </Link>
            and{' '}
            <Link
              href="/terms"
              className="text-button-link hover:cursor-pointer hover:text-button-primary-hover"
            >
              Privacy Policy
            </Link>
          </label>
        </div>

        {/* Info: (20251016 - Julian) Button part */}
        <div className="mt-40px flex flex-col items-center gap-8px">
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
      </div>
    </>
  );
}
