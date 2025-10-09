'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

const StatusDisplay = ({ status, error }: { status: string; error: string | null }) => (
  <div className="mt-6 w-full text-center">
    <p className="text-gray-600">{status}</p>
    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
  </div>
);

function ApproveDeviceInternal() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('準備批准新裝置...');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (!sessionId) {
      setError('無效的請求：缺少 session ID。');
      setStatusMessage('請返回新裝置頁面，重新掃描 QR Code。');
    } else {
      setStatusMessage('一個新裝置正在請求連結至您的帳戶。');
    }
  }, [sessionId]);

  const handleApprove = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);
    setStatusMessage('請使用此裝置的 Passkey 進行身分驗證...');

    try {
      // Info: (20251009 - Tzuhan) 步驟 1: 獲取此「舊裝置」的登入選項
      const optionsRes = await fetch(`${origin}${routes.auth.webauthn.options()}`);
      if (!optionsRes.ok) throw new Error('無法獲取驗證選項。');
      const options = await optionsRes.json();

      // Info: (20251009 - Tzuhan) 步驟 2: 在此「舊裝置」上執行 FIDO2 登入
      const authentication = await fido2ClientService.startLogin(options);

      // Info: (20251009 - Tzuhan) 步驟 3: 將登入結果和 sessionId 一起發送到後端進行批准
      setStatusMessage('正在傳送批准資訊...');
      const dewt = localStorage.getItem('dewt'); // Info: (20251009 - Tzuhan) 舊裝置必須是登入狀態
      if (!dewt) throw new Error('您必須在此裝置上登入才能批准新裝置。');

      const approveRes = await fetch(`${origin}${routes.auth.verifyQrLogin()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dewt}`,
        },
        body: JSON.stringify({ sessionId, fido2Authentication: authentication }),
      });

      const result = await approveRes.json();
      if (!approveRes.ok || !result.success) {
        throw new Error(result.message || '批准失敗。');
      }

      setStatusMessage('✅ 批准成功！新裝置現在可以繼續設定了。');
      // Info: (20251009 - Tzuhan) 可選：短暫延遲後關閉此頁面或跳轉
      setTimeout(() => router.push('/profile'), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤。';
      setStatusMessage('批准流程失敗。');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, router]);

  const handleDeny = () => {
    // Info: (20251009 - Tzuhan) 可選：通知後端此 session 已被拒絕
    setStatusMessage('您已拒絕該請求。');
    setTimeout(() => router.push('/profile'), 2000);
  };

  return (
    <div className="flex w-full grow flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">批准新裝置</h1>
          <p className="mt-4 text-gray-600">一個新裝置正請求加入您的帳戶。請確認這是您本人操作。</p>

          <div className="mt-8 w-full space-y-4">
            <button
              onClick={handleApprove}
              disabled={isLoading || !sessionId}
              className="w-full rounded-lg bg-purple-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isLoading ? '處理中...' : '批准'}
            </button>
            <button
              onClick={handleDeny}
              disabled={isLoading}
              className="w-full rounded-lg bg-gray-200 px-5 py-3 text-base font-semibold text-gray-800 shadow-sm hover:bg-gray-300"
            >
              拒絕
            </button>
          </div>
          <StatusDisplay status={statusMessage} error={error} />
        </div>
      </div>
    </div>
  );
}

// Info: (20251009 - Tzuhan) Helper component to ensure useSearchParams is used within a Suspense boundary
export default function ApproveDeviceClient() {
  return (
    <Suspense fallback={<div>Loading session...</div>}>
      <ApproveDeviceInternal />
    </Suspense>
  );
}
