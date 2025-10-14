'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import Pusher from 'pusher-js';
import { routes } from '@/config/api-routes';
import { getPusherInstance } from '@/lib/pusher_client';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

export default function LoginWithDeviceClient() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('正在產生 QR Code...');
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
        setStatusMessage('請使用您已登入的手機掃描 QR Code 以登入此裝置。');

        pusherClient = getPusherInstance();
        const channel = pusherClient.subscribe(`private-login-session-${sessionId}`);

        channel.bind('login-success', async (eventData: { dewt: string }) => {
          setStatusMessage('✅ 授權成功！正在為您登入...');
          // localStorage.setItem('dewt', eventData.dewt);
          await login(eventData.dewt);
          setTimeout(() => router.push('/profile'), 1500);
        });

        channel.bind('login-error', (eventData: { message: string }) => {
          setError(eventData.message || '手機端授權失敗。');
          setStatusMessage('授權失敗，請重試或返回。');
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
    <div className="flex grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">使用其他裝置登入</h1>
        <p className="mt-4 text-gray-600">{statusMessage}</p>
        <div className="mt-6 flex size-72 w-full items-center justify-center self-center rounded-lg border p-2">
          {isLoading && <div className="animate-pulse">Loading...</div>}
          {error && <p className="text-red-500">{error}</p>}
          {qrCodeDataUrl && (
            <Image
              src={qrCodeDataUrl}
              alt="Login QR Code"
              width={256}
              height={256}
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          )}
        </div>
        <Link href="/auth/login" className="mt-8 inline-block text-purple-600 hover:underline">
          返回
        </Link>
      </div>
    </div>
  );
}
