'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import Pusher from 'pusher-js';
import { routes } from '@/config/api_routes';
import { getPusherInstance } from '@/lib/pusher_client';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import { RegisterOptions } from '@passwordless-id/webauthn/dist/esm/types';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

export default function AddDeviceClient() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('正在產生 QR Code...');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false); // Info: (20251014 - Tzuhan) 新增 state
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const channelName = sessionId ? `private-login-session-${sessionId}` : null;

  // Info: (20251014 - Tzuhan) 批准裝置的處理函式
  const handleApproveDevice = useCallback(async () => {
    const dewt = localStorage.getItem('dewt');
    if (!sessionId || !dewt || !channelName) {
      setError('會話無效或您已登出。');
      return;
    }
    setIsLoading(true);
    setStatusMessage('正在取得授權...');
    try {
      // Info: (20251014 - Tzuhan) 步驟 1: 為新裝置獲取 FIDO2 註冊選項
      const res = await fetch(`${origin}${routes.auth.webauthn.options('register')}`, {
        headers: { Authorization: `Bearer ${dewt}` },
      });
      const registrationOptions: RegisterOptions = await res.json();
      if (!res.ok) throw new Error('無法獲取註冊選項');

      // Info: (20251014 - Tzuhan) 步驟 2: 呼叫後端 API 將 session 狀態設為 AUTHORIZED
      await fetch(`${origin}${routes.pairing.authorize()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dewt}` },
        body: JSON.stringify({ sessionId, challenge: registrationOptions.challenge }),
      });

      // Info: (20251014 - Tzuhan) 步驟 3: 透過 Pusher 將註冊選項發送給新裝置
      const pusherClient: Pusher = getPusherInstance();
      pusherClient
        .subscribe(channelName)
        .trigger('client-initiate-registration', { registrationOptions });

      setStatusMessage('授權已發送！請在新裝置上完成操作...');
      setIsDeviceConnected(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '批准失敗。');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, channelName]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      // Info: (20251014 - Tzuhan) Info: (20251009 - Tzuhan) 此頁面必須在登入狀態下才能操作
      setError('您必須先登入才能新增裝置。');
      setStatusMessage('錯誤：未授權');
      setIsLoading(false);
      setTimeout(() => router.push(BM_URL.LOGIN), 3000);
      return;
    }

    const initializeQrSession = async () => {
      try {
        const dewt = localStorage.getItem('dewt');
        const res = await fetch(`${origin}${routes.pairing.initiate()}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${dewt}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        const newSessionId = data.payload.sessionId;
        setSessionId(newSessionId);

        const setupUrl = new URL(`${origin}${BM_URL.SETUP_NEW_DEVICE}`);
        setupUrl.searchParams.set('sessionId', newSessionId);

        const dataUrl = await QRCode.toDataURL(setupUrl.toString(), { width: 256, margin: 2 });
        setQrCodeDataUrl(dataUrl);
        setStatusMessage('請使用您的新裝置掃描此 QR Code。');
      } catch (err) {
        setError(err instanceof Error ? err.message : '初始化失敗。');
      } finally {
        setIsLoading(false);
      }
    };

    initializeQrSession();
  }, [router, isAuthLoading, user]);

  // Info: (20251014 - Tzuhan) 專門用來處理 Pusher 事件的 useEffect
  useEffect(() => {
    if (!channelName) return;

    const pusherClient = getPusherInstance();
    const channel = pusherClient.subscribe(channelName);

    // Info: (20251014 - Tzuhan) 監聽新裝置已掃碼並準備就緒的事件
    channel.bind('client-new-device-ready', () => {
      setStatusMessage('新裝置已連線！請點擊下方按鈕批准。');
      setIsDeviceConnected(true);
    });

    channel.bind('device-added-success', () => {
      setStatusMessage('✅ 新裝置已成功加入您的帳戶！');
      alert('新裝置已成功加入您的帳戶！');
      setIsDeviceConnected(false);
    });

    channel.bind('device-added-error', (data: { message: string }) => {
      setError(data.message || '新增裝置失敗，請重試。');
      setIsDeviceConnected(false);
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [channelName]);

  if (isAuthLoading) {
    return <div className="flex grow items-center justify-center">正在驗證您的登入狀態...</div>;
  }

  return (
    <div className="flex grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">新增一個裝置</h1>
        <p className="mt-4 text-gray-600">{statusMessage}</p>
        <div className="mt-6 flex size-72 w-full items-center justify-center self-center rounded-lg border p-2">
          {isLoading && !qrCodeDataUrl && <div className="animate-pulse">Loading...</div>}
          {error && <p className="text-red-500">{error}</p>}
          {/* Info: (20251014 - Tzuhan) 根據 isDeviceConnected 狀態決定顯示 QR Code 或提示訊息 */}
          {qrCodeDataUrl && !isDeviceConnected && (
            <Image
              src={qrCodeDataUrl}
              alt="Add device QR Code"
              width={256}
              height={256}
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          )}
          {isDeviceConnected && <p className="text-xl font-semibold">✔️ 新裝置已連線</p>}
        </div>

        {/* Info: (20251014 - Tzuhan) 批准按鈕，僅在新裝置連線後顯示 */}
        {isDeviceConnected && (
          <button
            onClick={handleApproveDevice}
            disabled={isLoading}
            className="mt-6 w-full rounded-lg bg-purple-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-purple-700 disabled:bg-gray-400"
          >
            {isLoading ? '處理中...' : '批准新增此裝置'}
          </button>
        )}

        <Link href={BM_URL.PROFILE} className="mt-8 inline-block text-purple-600 hover:underline">
          返回裝置管理
        </Link>
      </div>
    </div>
  );
}
