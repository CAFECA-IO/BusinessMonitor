'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { TbFaceId } from 'react-icons/tb';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import Button from '@/components/common/button';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

export default function LoginClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFidoAvailable, setIsFidoAvailable] = useState(true);
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
    }
  }, []);

  const handleLogin = useCallback(async () => {
    if (!isFidoAvailable) return;

    setIsLoading(true);

    try {
      const optionsRes = await fetch(`${origin}${routes.auth.webauthn.options()}`);
      if (!optionsRes.ok) throw new Error('無法從伺服器獲取登入選項。');
      const options = await optionsRes.json();

      const authentication = await fido2ClientService.startLogin(options);

      const verifyRes = await fetch(`${origin}${routes.auth.webauthn.verify()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authentication),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || '登入驗證失敗。');
      }

      // localStorage.setItem('dewt', verifyData.payload.dewt);
      await login(verifyData.payload.dewt);
      setTimeout(() => router.push('/profile'), 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤。';
      alert(errorMessage);
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
    <div className="flex flex-col items-center justify-center p-24px">
      <Image
        src="/elements/graphic.png"
        width={344}
        height={257}
        alt="graphic"
        className="shrink-0"
      />

      <div className="mt-72px flex flex-col gap-16px">
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

      <div className="mt-72px">
        <Button type="button" variant="primaryBorderless" size="extraSmall">
          <Link href={BM_URL.SIGN_UP}>I don’t have my Digital ID yet.</Link>
        </Button>
      </div>
    </div>
  );
}
