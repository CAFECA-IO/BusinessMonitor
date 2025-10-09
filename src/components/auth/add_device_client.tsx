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

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

export default function AddDeviceClient() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('正在產生新裝置的設定 QR Code...');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Info: (20251009 - Tzuhan) 此頁面必須在登入狀態下才能操作
    const dewt = localStorage.getItem('dewt');
    if (!dewt) {
      setError('您必須先登入才能新增裝置。');
      setStatusMessage('錯誤：未授權');
      setIsLoading(false);
      // Info: (20251009 - Tzuhan) 可選：幾秒後跳轉回登入頁
      setTimeout(() => router.push(BM_URL.LOGIN), 3000);
      return;
    }

    let pusherClient: Pusher | null = null;
    const initializeQrSession = async () => {
      try {
        const res = await fetch(`${origin}${routes.pairing.initiate()}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${dewt}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        const { sessionId } = data.payload;
        const setupUrl = new URL(`${origin}/${BM_URL.SETUP_NEW_DEVICE}`);
        setupUrl.searchParams.set('sessionId', sessionId);

        const dataUrl = await QRCode.toDataURL(setupUrl.toString(), { width: 256, margin: 2 });
        setQrCodeDataUrl(dataUrl);
        setStatusMessage('請使用您的「新裝置」掃描此 QR Code 以完成設定。');

        pusherClient = getPusherInstance();
        const channel = pusherClient.subscribe(`private-login-session-${sessionId}`);

        channel.bind('device-added-success', () => {
          setStatusMessage('✅ 新裝置已成功加入您的帳戶！');
          alert('新裝置已成功加入您的帳戶！');

          // setTimeout(() => router.push('/profile/devices'), 2000);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '初始化 QR Code 失敗。');
      } finally {
        setIsLoading(false);
      }
    };

    initializeQrSession();

    return () => pusherClient?.disconnect();
  }, [router]);

  return (
    <div className="flex grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">新增一個裝置</h1>
        <p className="mt-4 text-gray-600">{statusMessage}</p>
        <div className="mt-6 flex size-72 items-center justify-center self-center rounded-lg border p-2">
          {isLoading && <div className="animate-pulse">Loading...</div>}
          {error && <p className="text-red-500">{error}</p>}
          {qrCodeDataUrl && (
            <Image
              src={qrCodeDataUrl}
              alt="Add device QR Code"
              width={256}
              height={256}
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          )}
        </div>
        <Link href="/profile/devices" className="mt-8 inline-block text-purple-600 hover:underline">
          返回裝置管理
        </Link>
      </div>
    </div>
  );
}
