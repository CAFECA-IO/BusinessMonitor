'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import Pusher from 'pusher-js';
import Image from 'next/image';
// import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';
import { getPusherInstance } from '@/lib/pusher_client';
import { BM_URL } from '@/constants/url';

// 在模組頂層讀取環境變數
const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

// 簡易的狀態顯示元件
const StatusDisplay = ({ status, error }: { status: string; error: string | null }) => (
  <div className="mt-8 w-full rounded-lg border border-gray-200 bg-gray-50 p-6">
    <h3 className="text-lg font-semibold text-gray-800">處理狀態</h3>
    <p className="mt-2 text-gray-600">
      狀態: <span className="font-medium text-gray-900">{status}</span>
    </p>
    {error && (
      <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
        <p className="font-bold text-red-700">發生錯誤:</p>
        <p className="mt-1 break-words text-red-600">{error}</p>
      </div>
    )}
  </div>
);

export default function AddDeviceClient() {
  const [mode, setMode] = useState<'select' | 'backup' | 'qr'>('select');
  // const [backupKey, setBackupKey] = useState('');  // Info: (20251009 - Tzuhan) Deprecated
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('請選擇一種方式來新增裝置或恢復您的帳戶。');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /** Info: (20251009 - Tzuhan) Deprecated
  // --- 備份碼恢復邏輯 ---
  const handleBackupKeySubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage('正在驗證您的備份碼...');

    try {
      // 1. 提交備份碼，獲取註冊選項
      const initiateRes = await fetch(`${origin}${routes.auth.recover.initiate()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupKey }),
      });
      const options = await initiateRes.json();
      if (!initiateRes.ok) throw new Error(options.message || '備份碼驗證失敗。');

      // 2. 啟動 Passkey 註冊
      setStatusMessage('請依照瀏覽器提示，建立此新裝置的 Passkey...');
      const registration = await fido2ClientService.startRegistration(options.payload);

      // 3. 完成恢復流程
      setStatusMessage('正在將新裝置綁定至您的帳戶...');
      const completeRes = await fetch(`${origin}${routes.auth.recover.complete()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration),
      });
      const result = await completeRes.json();
      if (!completeRes.ok) throw new Error(result.message || '綁定新裝置失敗。');

      setStatusMessage('✅ 裝置新增成功！正在為您登入...');
      localStorage.setItem('dewt', result.payload.dewt);
      setTimeout(() => router.push('/profile'), 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤。';
      setStatusMessage('恢復流程失敗。');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [backupKey, router]);
 */

  // --- QR Code 授權邏輯 (與 login 頁面類似) ---
  useEffect(() => {
    if (mode !== 'qr') return;

    let pusherClient: Pusher | null = null;
    const initializeQrSession = async () => {
      setIsLoading(true);
      setError(null);
      setStatusMessage('正在產生授權 QR Code...');

      try {
        const res = await fetch(`${origin}${routes.pairing.initiate()}`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || '無法初始化授權連線。');

        const { sessionId, challenge } = data.payload;
        const scanUrl = new URL(`${origin}/${BM_URL.AUTH_APPROVE_DEVICE}`); // 注意: 這裡的路徑應指向手機端掃碼後打開的頁面
        scanUrl.searchParams.set('sessionId', sessionId);
        scanUrl.searchParams.set('challenge', challenge);

        const dataUrl = await QRCode.toDataURL(scanUrl.toString(), { width: 300 });
        setQrCodeDataUrl(dataUrl);
        setStatusMessage('請使用您已登入的裝置掃描 QR Code 以進行授權。');

        pusherClient = getPusherInstance();
        const channelName = `private-login-session-${sessionId}`;
        const channel = pusherClient.subscribe(channelName);

        channel.bind('login-success', (eventData: { dewt: string }) => {
          setStatusMessage('✅ 授權成功！此裝置已新增，正在登入...');
          localStorage.setItem('dewt', eventData.dewt);
          // 注意: 這裡可能需要一個不同的 API 來確認新裝置已註冊 Passkey
          // 簡化流程：直接登入
          setTimeout(() => router.push('/profile'), 1500);
        });

        channel.bind('pusher:subscription_error', () => setError('無法建立安全連線，請重試。'));
      } catch (err) {
        const message = err instanceof Error ? err.message : '發生未知錯誤。';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeQrSession();

    return () => {
      pusherClient?.disconnect();
    };
  }, [mode, router]);

  const renderContent = () => {
    switch (mode) {
      /** Info: (20251009 - Tzuhan) Deprecated
      case 'backup':
        return (    
          <>
            <h2 className="text-xl font-semibold text-gray-800">輸入備份碼</h2>
            <div className="mt-4 w-full space-y-4">
              <label htmlFor="backupKeyInput" className="block text-sm font-medium text-gray-700">
                備份碼
              </label>
              <input
                id="backupKeyInput"
                type="password"
                value={backupKey}
                onChange={(e) => setBackupKey(e.target.value)}
                placeholder="請貼上您的備份碼"
                className="block w-full rounded-md border-0 px-3 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-purple-600"
                disabled={isLoading}
                aria-labelledby="backupKeyInput"
              />
              <button
                onClick={handleBackupKeySubmit}
                disabled={isLoading || !backupKey}
                className="w-full rounded-lg bg-purple-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-purple-700 disabled:bg-gray-400"
              >
                驗證並新增裝置
              </button>
              <button
                onClick={() => setMode('select')}
                className="w-full text-center text-sm text-gray-600 hover:underline"
              >
                返回選擇
              </button>
            </div>
          </>
        );
      */
      case 'qr':
        return (
          <>
            <h2 className="text-xl font-semibold text-gray-800">使用已註冊裝置授權</h2>
            {isLoading && <p>正在產生 QR Code...</p>}
            {qrCodeDataUrl && (
              <Image
                src={qrCodeDataUrl}
                alt="授權 QR Code"
                width={300}
                height={300}
                style={{ objectFit: 'contain' }}
                unoptimized
              />
            )}
            <button
              onClick={() => setMode('select')}
              className="mt-4 w-full text-center text-sm text-gray-600 hover:underline"
            >
              返回選擇
            </button>
          </>
        );
      case 'select':
      default:
        return (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">新增裝置</h1>
            <p className="mt-2 text-gray-500">選擇一種方式來恢復您的帳戶</p>
            <div className="mt-10 w-full space-y-4 sm:max-w-sm">
              {/* <button
                onClick={() => setMode('backup')}
                className="w-full rounded-lg bg-white px-5 py-3.5 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                使用備份碼恢復
              </button> */}
              <button
                onClick={() => setMode('qr')}
                className="w-full rounded-lg bg-white px-5 py-3.5 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                使用已註冊裝置掃碼授權
              </button>
            </div>
            <p className="mt-8 text-center text-sm">
              <Link href="/auth/login" className="font-semibold text-purple-600 hover:underline">
                返回登入
              </Link>
            </p>
          </>
        );
    }
  };

  return (
    <div className="flex w-full grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 shadow-lg sm:p-12">
          {renderContent()}
        </div>
        <StatusDisplay status={statusMessage} error={error} />
      </div>
    </div>
  );
}
