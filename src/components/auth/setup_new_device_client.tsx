'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Pusher from 'pusher-js';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api_routes';
import { getPusherInstance } from '@/lib/pusher_client';
import { RegisterOptions } from '@passwordless-id/webauthn/dist/esm/types';
import { useAuth } from '@/contexts/auth_context';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

function SetupNewDeviceInternal() {
  const [statusMessage, setStatusMessage] = useState('正在連接安全頻道...');
  const [error, setError] = useState<string | null>(null);
  const [registrationOptions, setRegistrationOptions] = useState<RegisterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const { login } = useAuth();

  const handleStartRegistration = useCallback(async () => {
    if (!registrationOptions || !sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      setStatusMessage('請在此裝置上建立 Passkey...');
      const registration = await fido2ClientService.startRegistration(registrationOptions);

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
      await login(result.payload.dewt);
      router.push('/profile');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setStatusMessage(
        (err as Error).name === 'NotAllowedError'
          ? '您取消了操作，或頁面沒有焦點。'
          : '設定新裝置時發生錯誤。'
      );
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [registrationOptions, sessionId, login, router]);

  useEffect(() => {
    if (!sessionId) {
      setStatusMessage('錯誤：無效的設定連結。');
      setError('請返回您已登入的裝置，重新產生 QR Code。');
      return;
    }

    const pusherClient: Pusher = getPusherInstance();
    const channelName = `private-login-session-${sessionId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {
      setStatusMessage('連線成功！正在等待您的舊裝置批准...');
      channel.trigger('client-new-device-ready', {});
    });

    channel.bind('pusher:subscription_error', () => {
      setError('無法建立安全連線，請重試。');
    });

    channel.bind(
      'client-initiate-registration',
      (payload: { registrationOptions: RegisterOptions }) => {
        if (!payload.registrationOptions) {
          setError('從伺服器收到的授權資訊無效。');
          return;
        }
        // Info: (20251014 - Tzuhan) 收到事件後，只更新 state 和 UI，不直接呼叫 API
        setStatusMessage('✅ 授權成功！請點擊下方按鈕開始建立 Passkey。');
        setRegistrationOptions(payload.registrationOptions);
      }
    );

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [sessionId]);

  return (
    <div className="flex grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">設定新裝置</h1>
        <div className="mt-6">
          <p className="text-gray-600">{statusMessage}</p>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>

        {registrationOptions && (
          <div className="mt-8 w-full">
            <button
              onClick={handleStartRegistration}
              disabled={isLoading}
              className="w-full rounded-lg bg-purple-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isLoading ? '處理中...' : '建立 Passkey'}
            </button>
          </div>
        )}

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
