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

// Info: (20251202 - Tzuhan) 引入公鑰解析工具
import { parsePublicKeyCoordinates } from '@/lib/fido2-parse';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

// Info: (20251202 - Tzuhan) 輔助函式
const toBigInt = (base64Url: string) => {
  try {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(base64);
    let hex = '0x';
    for (let i = 0; i < bin.length; i++) hex += bin.charCodeAt(i).toString(16).padStart(2, '0');
    return BigInt(hex);
  } catch (e) {
    console.error('Base64 conversion error:', e);
    return BigInt(0);
  }
};

function SetupNewDeviceInternal() {
  const [statusMessage, setStatusMessage] = useState('正在連接安全頻道...');
  const [error, setError] = useState<string | null>(null);
  const [registrationOptions, setRegistrationOptions] = useState<RegisterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false); // [PoC 4] 等待授權狀態

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

      // Info: (20251202 - Tzuhan) 解析公鑰
      const coords = parsePublicKeyCoordinates(registration.response.attestationObject);
      if (!coords) throw new Error('無法解析 Passkey 公鑰。');

      setStatusMessage('正在傳送公鑰給舊裝置...');

      // Info: (20251202 - Tzuhan) 呼叫後端，傳送候選公鑰
      const res = await fetch(`${origin}${routes.pairing.complete()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fido2Registration: registration,
          candidatePublicKey: {
            x: toBigInt(coords.x).toString(),
            y: toBigInt(coords.y).toString(),
          },
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || '傳送公鑰失敗。');
      }

      // Info: (20251202 - Tzuhan) 成功傳送後，進入等待模式，不直接登入
      setStatusMessage('✅ 公鑰已傳送！請回到舊裝置上「批准」此請求 (簽署區塊鏈交易)...');
      setIsWaitingForApproval(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setStatusMessage(
        (err as Error).name === 'NotAllowedError' ? '您取消了操作。' : '設定失敗，請重試。'
      );
      setError(errorMessage);
      setIsLoading(false); // Info: (20251202 - Tzuhan) 只有失敗才取消 loading，成功的話保持 loading 狀態直到跳轉
    }
  }, [registrationOptions, sessionId]);

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
      if (!isWaitingForApproval) {
        setStatusMessage('連線成功！正在等待您的舊裝置發起邀請...');
        channel.trigger('client-new-device-ready', {});
      }
    });

    channel.bind('pusher:subscription_error', () => {
      setError('無法建立安全連線，請重試。');
    });

    //  Info: (20251202 - Tzuhan)1. 收到註冊選項 (開始流程)
    channel.bind(
      'client-initiate-registration',
      (payload: { registrationOptions: RegisterOptions }) => {
        if (!payload.registrationOptions) {
          setError('授權資訊無效。');
          return;
        }
        setStatusMessage('✅ 連線建立！請點擊下方按鈕產生新鑰匙。');
        setRegistrationOptions(payload.registrationOptions);
      }
    );

    //  Info: (20251202 - Tzuhan)[PoC 4] 2. 收到授權成功通知 (流程結束)
    //  Info: (20251202 - Tzuhan)當 Device A 完成 addSigner 交易後，後端會發送此事件並帶上 Token
    channel.bind('device-added-success', async (data: { dewt: string }) => {
      if (data && data.dewt) {
        setStatusMessage('🎉 授權成功！區塊鏈已確認您的身份。正在登入...');
        await login(data.dewt);
        router.push('/profile');
      } else {
        //  Info: (20251202 - Tzuhan)如果是舊流程或沒帶 token，嘗試重新導向登入頁
        setStatusMessage('裝置新增成功！請重新登入。');
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    });

    channel.bind('device-added-error', (data: { message: string }) => {
      setError(data.message || '授權失敗，請重試。');
      setIsLoading(false);
      setIsWaitingForApproval(false);
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [sessionId, isWaitingForApproval, login, router]);

  return (
    <div className="flex grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">設定新裝置 (Device B)</h1>
        <div className="mt-6">
          <p className="text-gray-600">{statusMessage}</p>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>

        {/* 顯示按鈕條件：有選項 且 還沒進入等待授權階段 */}
        {registrationOptions && !isWaitingForApproval && (
          <div className="mt-8 w-full">
            <button
              onClick={handleStartRegistration}
              disabled={isLoading}
              className="w-full rounded-lg bg-purple-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isLoading ? '處理中...' : '建立 Passkey 並傳送'}
            </button>
          </div>
        )}

        {/* 等待授權時顯示 Loading 動畫 */}
        {isWaitingForApproval && (
          <div className="mt-8 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
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
