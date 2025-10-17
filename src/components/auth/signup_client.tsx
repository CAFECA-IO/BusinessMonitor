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

export default function SignupClient() {
  // ToDo: (20251016 - Julian) Default avatar image path
  const defaultAvatar = '/fake_avatar/business_img_1.jpg';

  const [name, setName] = useState<string>('');
  const [isNameValid, setIsNameValid] = useState<boolean>(true);
  const [avatarUrl, setAvatarUrl] = useState<string>(defaultAvatar);
  const [agreed, setAgreed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Info: (20251016 - Julian) During development
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [statusMessage, setStatusMessage] = useState('請輸入您的資訊以建立 Digital ID。');
  // Info: (20251016 - Julian) During development
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const [isFidoAvailable, setIsFidoAvailable] = useState<boolean>(true);

  // Info: (20251016 - Julian) 只允許英文字母 + 中文
  // const namePattern = /^[A-Za-z\u4e00-\u9fa5_]+$/u;

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

  // ToDo: (20251016 - Julian) Random avatar function, need to replace with real avatar images
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
          >
            <FiUpload size={16} />
            <p>Upload My Photo</p>
          </Button>
        </div>

        {/* Info: (20251016 - Julian) Name input part */}
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
          {/* Info: (20251016 - Julian) Naming rule */}
          {!isNameValid && (
            <p className="text-sm text-text-error">No numbers or symbols, e.g. 123, @, #, !</p>
          )}
        </div>

        {/* Info: (20251016 - Julian) Terms checkbox part */}
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
              <Link href="/terms">
                <Button type="button" variant="primaryBorderless" size="link">
                  Terms of Service
                </Button>
              </Link>
              <p>and</p>
              <Link href="/privacy">
                <Button type="button" variant="primaryBorderless" size="link">
                  Privacy Policy
                </Button>
              </Link>
            </label>
          </div>
        </div>

        {/* Info: (20251016 - Julian) Button part */}
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
      </div>
    </>
  );
}
