'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api_routes';
import { getPusherInstance } from '@/lib/pusher_client';
import { RegisterOptions } from '@passwordless-id/webauthn/dist/esm/types';
import { useAuth } from '@/contexts/auth_context';
import { parsePublicKeyCoordinates } from '@/lib/fido2-parse';
import type { IApiResponse } from '@/lib/response';
import { toBigInt } from '@/lib/common';
import { UAParser } from 'ua-parser-js';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

function SetupNewDeviceInternal() {
  const [statusMessage, setStatusMessage] = useState('正在初始化...');
  const [error, setError] = useState<string | null>(null);
  const [registrationOptions, setRegistrationOptions] = useState<RegisterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [label, setLabel] = useState('');

  //  Info: (20251202 - Tzuhan) [PoC 4 Debug] 儲存本地生成的公鑰以供顯示
  const [debugKeyInfo, setDebugKeyInfo] = useState<{ x: string; y: string } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const urlChallenge = searchParams.get('challenge');
  const { login } = useAuth();

  useEffect(() => {
    const parser = new UAParser();
    const os = parser.getOS().name || 'Unknown OS';
    const browser = parser.getBrowser().name || 'Unknown Browser';
    setLabel(`${os} - ${browser}`);
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setStatusMessage('正在獲取設定參數...');
        const response = await fetch(`${origin}${routes.auth.webauthn.options('register')}`);
        const apiResponse: IApiResponse<RegisterOptions> = await response.json();

        if (!response.ok || !apiResponse.success || !apiResponse.payload) {
          throw new Error(apiResponse.message || '無法獲取註冊選項');
        }

        const options = apiResponse.payload;
        if (urlChallenge) {
          options.challenge = urlChallenge;
        }
        setRegistrationOptions(options);
        setStatusMessage('請點擊下方按鈕以設定此裝置');
      } catch (err) {
        setError((err as Error).message);
        setStatusMessage('初始化失敗');
      }
    };

    if (sessionId) {
      fetchOptions();
    } else {
      setError('無效的連結 (Missing Session ID)');
      setStatusMessage('錯誤');
    }
  }, [sessionId, urlChallenge]);

  const handleStartRegistration = useCallback(async () => {
    if (!registrationOptions || !sessionId) return;
    setIsLoading(true);
    setError(null);

    try {
      setStatusMessage('請依照瀏覽器提示建立 Passkey...');
      const registration = await fido2ClientService.startRegistration(registrationOptions);
      const coords = parsePublicKeyCoordinates(registration.response.attestationObject);
      if (!coords) throw new Error('無法解析 Passkey 公鑰。');

      const xStr = toBigInt(coords.x).toString();
      const yStr = toBigInt(coords.y).toString();

      setDebugKeyInfo({ x: xStr, y: yStr });

      setStatusMessage('正在傳送公鑰給管理員裝置...');

      const res = await fetch(`${origin}${routes.pairing.complete()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fido2Registration: registration,
          candidatePublicKey: {
            x: xStr,
            y: yStr,
            label,
          },
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || '傳送失敗。');
      }

      setStatusMessage('✅ 公鑰已傳送！請回到舊裝置 (管理員) 上點擊「批准」...');
      setIsWaitingForApproval(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setStatusMessage((err as Error).name === 'NotAllowedError' ? '您取消了操作。' : '設定失敗。');
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [label, registrationOptions, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const pusherClient = getPusherInstance();
    const channelName = `private-login-session-${sessionId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('device-added-success', async (data: { dewt: string }) => {
      if (data && data.dewt) {
        setStatusMessage('🎉 授權成功！正在登入...');
        await login(data.dewt);
        router.push('/profile');
      } else {
        setStatusMessage('授權完成！請嘗試重新登入。');
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    });

    channel.bind('device-added-error', (data: { message: string }) => {
      setError(data.message || '授權失敗');
      setIsLoading(false);
      setIsWaitingForApproval(false);
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [sessionId, login, router]);

  return (
    <div className="flex grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">設定新裝置 ({label})</h1>
        <div className="mt-6">
          <p className="text-gray-600">{statusMessage}</p>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>

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

        {isWaitingForApproval && (
          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            <div className="size-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>

            {/*  Info: (20251202 - Tzuhan) [Debug Info] 顯示已傳送的公鑰 */}
            {debugKeyInfo && (
              <div className="w-full rounded border border-blue-200 bg-blue-50 p-4 text-left">
                <p className="mb-1 text-xs font-bold text-blue-800">📤 Sent Public Key (Debug):</p>
                <div className="space-y-1 break-all font-mono text-[10px] text-blue-900">
                  <p>
                    <strong>X:</strong> {debugKeyInfo.x}
                  </p>
                  <p>
                    <strong>Y:</strong> {debugKeyInfo.y}
                  </p>
                </div>
              </div>
            )}
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
