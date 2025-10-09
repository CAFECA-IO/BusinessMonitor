'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Pusher from 'pusher-js';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';
import { getPusherInstance } from '@/lib/pusher_client';
import { RegisterOptions } from '@passwordless-id/webauthn/dist/esm/types';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

function SetupNewDeviceInternal() {
  const [statusMessage, setStatusMessage] = useState('正在連接安全頻道，請稍候...');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (!sessionId) {
      setStatusMessage('錯誤：無效的設定連結。');
      setError('請返回您已登入的裝置，重新產生 QR Code。');
      return;
    }

    let pusherClient: Pusher | null = null;

    pusherClient = getPusherInstance();
    // 注意：頻道名稱需要與 `add-device` 頁面中監聽的名稱一致
    const channelName = `private-add-device-${sessionId}`;
    const channel = pusherClient.subscribe(channelName);

    setStatusMessage('等待授權... 請在您已登入的裝置上批准此操作（如果需要）。');

    channel.bind('pusher:subscription_error', () => {
      setError('無法建立安全連線，請重試。');
    });

    channel.bind(
      'initiate-registration',
      async (payload: { registrationOptions: RegisterOptions }) => {
        try {
          if (!payload.registrationOptions) {
            throw new Error('從伺服器收到的授權資訊無效。');
          }

          setStatusMessage('✅ 授權成功！請在此裝置上建立 Passkey...');
          const registration = await fido2ClientService.startRegistration(
            payload.registrationOptions
          );

          setStatusMessage('正在完成裝置綁定...');
          const res = await fetch(`${origin}${routes.pairing.complete()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              fido2Registration: registration,
            }),
          });

          const result = await res.json();
          if (!res.ok || !result.success) {
            throw new Error(result.message || '綁定新裝置失敗。');
          }

          setStatusMessage('🎉 裝置新增成功！正在為您登入...');
          alert('新裝置已成功加入您的帳戶！');
          localStorage.setItem('dewt', result.payload.dewt);
          //   router.push('/auth/add-device-success');
        } catch (err) {
          setStatusMessage('設定新裝置時發生錯誤。');
          setError(err instanceof Error ? err.message : '未知錯誤');
        }
      }
    );

    return () => {
      pusherClient?.unsubscribe(channelName);
    };
  }, [sessionId, router]);

  return (
    <div className="flex grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">設定新裝置</h1>
        <div className="mt-6">
          <p className="text-gray-600">{statusMessage}</p>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
        <Link href="/auth/login" className="mt-8 inline-block text-purple-600 hover:underline">
          取消
        </Link>
      </div>
    </div>
  );
}

export default function SetupNewDeviceClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetupNewDeviceInternal />
    </Suspense>
  );
}
