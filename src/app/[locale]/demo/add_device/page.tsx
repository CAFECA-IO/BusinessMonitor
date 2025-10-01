'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import Link from 'next/link';
import Pusher from 'pusher-js';
import { routes } from '@/config/api-routes';

// Info: (20251001-tzuhan) 確保 Pusher Key 和 Cluster 已在環境變數中設定
if (
  !process.env.NEXT_PUBLIC_PUSHER_KEY ||
  !process.env.NEXT_PUBLIC_PUSHER_CLUSTER ||
  !process.env.NEXT_PUBLIC_ORIGIN // Info: (20251001-tzuhan) 【新增】也檢查 ORIGIN
) {
  throw new Error(
    'NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER, and NEXT_PUBLIC_ORIGIN are not set in .env'
  );
}

export default function QrLoginPage() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('正在初始化登入連線...');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let pusherClient: Pusher | null = null;

    const initializeLoginSession = async () => {
      try {
        // 1. 從後端獲取 sessionId 和 challenge 來生成 QR Code
        const res = await fetch(routes.pairing.initiate(), { method: 'POST' });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || '無法初始化登入連線。');
        }

        const { sessionId, challenge } = data.payload;

        // Info: (20251001-tzuhan) 直接生成一個完整的 URL 給 QR Code
        // 這樣手機掃碼後可以直接在瀏覽器中打開
        const scanUrl = new URL(`${process.env.NEXT_PUBLIC_ORIGIN}/demo/scan`);
        scanUrl.searchParams.set('sessionId', sessionId);
        scanUrl.searchParams.set('challenge', challenge);
        const qrPayload = scanUrl.toString();

        setStatusMessage('請使用您的手機相機掃描 QR Code 以登入。');
        const dataUrl = await QRCode.toDataURL(qrPayload, { width: 300 });
        setQrCodeDataUrl(dataUrl);

        // 2. 初始化 Pusher 並訂閱私有頻道
        pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
          authEndpoint: routes.pusher.auth(), // 使用 routes 來取得授權路徑
          authTransport: 'ajax',
        });

        const channelName = `private-login-session-${sessionId}`;
        const channel = pusherClient.subscribe(channelName);

        // 3. 綁定成功與失敗事件
        channel.bind('pusher:subscription_succeeded', () => {
          console.log(`Successfully subscribed to ${channelName}`);
        });

        channel.bind('pusher:subscription_error', (status: unknown) => {
          console.error(`Pusher subscription failed with status ${JSON.stringify(status)}`);
          setError('無法建立安全的即時通訊頻道，請重試。');
        });

        channel.bind('login-success', (eventData: { dewt: string }) => {
          setStatusMessage('✅ 驗證成功！即將將您導向儀表板...');
          localStorage.setItem('dewt', eventData.dewt);
          setTimeout(() => {
            router.push('/demo/me');
          }, 1500);
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : '發生未知錯誤。';
        console.error(message);
        setError(message);
      }
    };

    initializeLoginSession();

    // 4. 組件卸載時，清理 Pusher 連線
    return () => {
      if (pusherClient) {
        pusherClient.disconnect();
      }
    };
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">
            透過您的 Digital ID 登入
          </h1>
          <p className="mt-2 text-lg text-gray-500">{statusMessage}</p>
        </div>

        <div className="flex h-80 w-full items-center justify-center rounded-xl bg-white p-6 shadow-md">
          {error ? (
            <div className="text-center text-red-600">
              <p className="font-bold">發生錯誤</p>
              <p>{error}</p>
            </div>
          ) : qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="Login QR Code" />
          ) : (
            <div className="animate-pulse text-gray-400">正在載入 QR Code...</div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/demo/auth" className="text-blue-600 hover:underline">
            &larr; 返回登入頁
          </Link>
        </div>
      </div>
    </main>
  );
}
