'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { TbFaceId } from 'react-icons/tb';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import Button from '@/components/common/button';
import MessageModal from '@/components/auth/message_modal';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

export default function LoginClient() {
  const [isLoading, setIsLoading] = useState(false);
  // Info: (20251016 - Julian) During development

  const [statusMessage, setStatusMessage] = useState('點擊按鈕以 Passkey 登入或註冊。');
  // Info: (20251016 - Julian) During development
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const [isFidoAvailable, setIsFidoAvailable] = useState(true);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);

  const toggleMessageModal = () => setIsMessageModalVisible((prev) => !prev);

  const router = useRouter();
  const searchParams = useSearchParams();
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
      setIsMessageModalVisible(true);
    }
  }, []);

  const handleLogin = useCallback(async () => {
    if (!isFidoAvailable) return;

    setIsLoading(true);
    setError(null);
    setStatusMessage('正在準備 Passkey 登入...');

    const redirectTo = searchParams.get('redirectTo') || '';

    try {
      const optionsRes = await fetch(`${origin}${routes.auth.webauthn.options()}`);
      if (!optionsRes.ok) throw new Error('無法從伺服器獲取登入選項。');
      const optionsResponse = await optionsRes.json();
      if (!optionsResponse.success) {
        throw new Error(optionsResponse.message || '無法從伺服器獲取註冊選項。');
      }
      const options = optionsResponse.payload;

      setStatusMessage('請依照瀏覽器提示進行驗證...');
      const authentication = await fido2ClientService.startLogin(options);

      setStatusMessage('正在驗證您的 Passkey...');
      const verifyRes = await fetch(`${origin}${routes.auth.webauthn.verify()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authentication),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || '登入驗證失敗。');
      }

      setStatusMessage('✅ 登入成功！正在跳轉...');
      // localStorage.setItem('dewt', verifyData.payload.dewt);
      await login(verifyData.payload.dewt);

      if (redirectTo) {
        // Info: (20251029 - Julian) 如果 redirectTo 有值，則導向 approve_device 頁面，並帶上原本的參數
        const currentRedirectTo = `${BM_URL.APPROVE_DEVICE}?${decodeURIComponent(redirectTo)}`;
        setTimeout(() => router.push(currentRedirectTo), 500);
      } else {
        //  Info: (20251016 - Julian) 預設導向 Profile 頁面
        setTimeout(() => router.push('/profile'), 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤。';
      setStatusMessage(
        (err as Error).name === 'NotAllowedError' ? '您取消了登入操作。' : '登入失敗，請重試。'
      );
      setError(errorMessage);
      setIsMessageModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, [router, isFidoAvailable, login]);

  if (isAuthLoading || user) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center p-4">
        <p>正在驗證您的身份...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-24px">
      <Link href={BM_URL.HOME} className="shrink-0">
        <Image src="/logos/cafeca_logo.svg" alt="cafeca_logo" width={120} height={36} />
      </Link>

      <div className="mt-60px flex flex-1 flex-col items-center justify-end">
        <Image
          src="/elements/graphic.png"
          width={344}
          height={257}
          alt="graphic"
          className="shrink-0"
        />

        <div className="mt-40px flex flex-col gap-16px">
          <Button
            type="button"
            onClick={handleLogin}
            disabled={isLoading || !isFidoAvailable}
            size="extraLarge"
            className="gap-8px"
          >
            <TbFaceId size={18} />
            <p>{isLoading ? '處理中...' : 'Log in to my ID'}</p>
          </Button>
          <Button type="button" variant="secondary" size="extraLarge">
            <Link href={BM_URL.LOGIN_WITH_EXISTING_DEVICE}>Log in on a New Device</Link>
          </Button>
        </div>

        <div className="mt-40px">
          <Link href={BM_URL.SIGN_UP}>
            <Button type="button" variant="primaryBorderless" size="extraSmall">
              I don’t have my Digital ID yet.{' '}
            </Button>
          </Link>
        </div>
      </div>

      {isMessageModalVisible && (
        <MessageModal
          content={statusMessage ?? '--'}
          visibleHandler={toggleMessageModal}
          submitString="Try Again"
          submitHandler={handleLogin}
        />
      )}
    </div>
  );
}
