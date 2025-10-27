'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import Pusher from 'pusher-js';
import { routes } from '@/config/api-routes';
import { getPusherInstance } from '@/lib/pusher_client';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import Button from '@/components/common/button';
import AuthorizeViaExistingDevice from '@/components/auth/authorize_via_existing_device';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

export default function LoginWithDeviceClient() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // const [statusMessage, setStatusMessage] = useState('正在產生 QR Code...');
  const [error, setError] = useState<string | null>(null);
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
    if (isAuthLoading || user) {
      return;
    }
    let pusherClient: Pusher | null = null;
    const initializeQrSession = async () => {
      try {
        const res = await fetch(`${origin}${routes.pairing.initiate()}`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        const { sessionId, challenge } = data.payload;
        const scanUrl = new URL(`${origin}${BM_URL.APPROVE_DEVICE}`);
        scanUrl.searchParams.set('sessionId', sessionId);
        scanUrl.searchParams.set('challenge', challenge);

        const dataUrl = await QRCode.toDataURL(scanUrl.toString(), { width: 256, margin: 2 });
        setQrCodeDataUrl(dataUrl);
        // setStatusMessage('請使用您已登入的手機掃描 QR Code 以登入此裝置。');

        pusherClient = getPusherInstance();
        const channel = pusherClient.subscribe(`private-login-session-${sessionId}`);

        channel.bind('login-success', async (eventData: { dewt: string }) => {
          // setStatusMessage('✅ 授權成功！正在為您登入...');
          // localStorage.setItem('dewt', eventData.dewt);
          await login(eventData.dewt);
          setTimeout(() => router.push('/profile'), 1500);
        });

        channel.bind('login-error', (eventData: { message: string }) => {
          setError(eventData.message || '手機端授權失敗。');
          // setStatusMessage('授權失敗，請重試或返回。');
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '初始化 QR Code 失敗。');
      } finally {
        setIsLoading(false);
      }
    };

    initializeQrSession();

    return () => pusherClient?.disconnect();
  }, [isAuthLoading, login, router, user]);

  if (isAuthLoading || user) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center p-4">
        <p>正在驗證您的身份...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-surface-background p-4 px-24px py-32px">
      <h1 className="text-h5 font-bold text-text-secondary">Add New Device</h1>

      {/* Info: (20251021 - Julian) QR code part */}
      <AuthorizeViaExistingDevice
        error={error}
        isLoading={isLoading}
        qrCodeDataUrl={qrCodeDataUrl}
      />

      <Link href="/auth/login" className="w-full">
        <Button type="button" size="extraLarge" className="mt-40px w-full">
          Go Back
        </Button>
      </Link>
    </div>
  );
}
