'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiMapPin } from 'react-icons/fi';
import { HiOutlineDeviceTablet } from 'react-icons/hi';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';
import { useAuth } from '@/contexts/auth_context';
import { BM_URL } from '@/constants/url';
import Button from '@/components/common/button';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

const StatusDisplay = ({ status, error }: { status: string; error: string | null }) => (
  <div className="w-full text-left text-sm">
    <p className="text-text-secondary">{status}</p>
    {error && <p className="mt-2 text-xs text-text-error">{error}</p>}
  </div>
);

function ApproveDeviceInternal() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('準備批准新裝置...');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const challenge = searchParams.get('challenge');
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!user) {
      // Info: (20251009 - Tzuhan) 此頁面必須在登入狀態下才能操作
      setError('您必須先登入才能新增裝置。');
      setStatusMessage('錯誤：未授權');
      setIsLoading(false);
      setTimeout(() => router.push(BM_URL.LOGIN), 3000);
      return;
    }
    if (!sessionId || !challenge) {
      setError('無效的請求：缺少 session ID 或 challenge。');
      setStatusMessage('請返回新裝置頁面，重新掃描 QR Code。');
    } else {
      setStatusMessage('一個新裝置正在請求連結至您的帳戶。');
    }
  }, [challenge, isAuthLoading, router, sessionId, user]);

  const handleApprove = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage('請使用此裝置的 Passkey 進行身分驗證...');

    try {
      // Info: (20251009 - Tzuhan) 步驟 1: 獲取此「舊裝置」的登入選項
      const optionsRes = await fetch(`${origin}${routes.auth.webauthn.options()}`);
      if (!optionsRes.ok) throw new Error('無法獲取驗證選項。');
      const options = {
        challenge: challenge!,
        userVerification: 'required' as const,
      };

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
        body: JSON.stringify({ sessionId, fido2Assertion: authentication }),
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
      <div className="flex w-full flex-col items-stretch gap-24px rounded-radius-m bg-white px-24px pb-24px pt-40px text-center shadow-lg">
        <h1 className="text-lg font-bold text-text-primary">批准新裝置</h1>
        <p className="text-left text-base font-medium text-text-secondary">
          You&apos;re about to log in to:
        </p>
        <div className="flex flex-col gap-24px text-sm font-medium text-text-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4px">
              <FiMapPin size={20} />
              <p>Platform:</p>
            </div>
            <p>{'Platform'}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4px">
              <HiOutlineDeviceTablet size={20} />
              <p>Device Info:</p>
            </div>
            <p>{'Device Info'}</p>
          </div>
        </div>
        <StatusDisplay status={statusMessage} error={error} />
        <div className="grid grid-cols-2 gap-8px">
          <Button type="button" onClick={handleDeny} disabled={isLoading} variant="secondary">
            拒絕
          </Button>
          <Button type="button" onClick={handleApprove} disabled={isLoading || !sessionId}>
            {isLoading ? '處理中...' : '批准'}
          </Button>
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
