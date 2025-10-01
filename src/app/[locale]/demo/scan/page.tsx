'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api-routes';
import Link from 'next/link';

// Info: (20251001-tzuhan) 輔助元件：用於優雅地顯示 JSON 結果
const ResultDisplay = ({ title, data }: { title: string; data: object | string | null }) => {
  if (!data) return null;
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-500">{title}:</p>
      <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-all rounded-lg bg-gray-100 p-4 text-xs text-gray-800">
        <code>{content}</code>
      </pre>
    </div>
  );
};

export default function ScanPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('等待掃碼結果...');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<object | null>(null);
  const [qrData, setQrData] = useState<{ sessionId: string; challenge: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Info: (20251001-tzuhan) 在真實 App 中，這段邏輯會由 QR Code 掃描器觸發
  // 這裡我們用 URL query 參數來模擬掃碼結果
  useEffect(() => {
    const session = searchParams.get('sessionId');
    const challenge = searchParams.get('challenge');
    if (session && challenge) {
      setQrData({ sessionId: session, challenge: challenge });
      setStatusMessage('已成功掃描！請點擊下方按鈕以確認登入。');
    } else {
      setStatusMessage('請先從桌面端取得 QR Code。此頁面用於模擬手機掃碼後的流程。');
    }
  }, [searchParams]);

  const handleLoginConfirm = useCallback(async () => {
    if (!qrData) {
      setError('沒有有效的 QR Code 數據。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setStatusMessage('請透過您的裝置進行生物辨識或 PIN 驗證...');

    try {
      if (!fido2ClientService.isAvailable()) {
        throw new Error('WebAuthn 在此瀏覽器或環境中不可用（例如，非安全來源）。');
      }
      // 1. 執行 FIDO2 登入
      const fido2Assertion = await fido2ClientService.startLogin({
        challenge: qrData.challenge,
      });

      setStatusMessage('FIDO2 驗證成功！正在將授權傳送至伺服器...');

      // 2. 將驗證結果發送到後端
      const res = await fetch(routes.auth.verifyQrLogin(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: qrData.sessionId,
          fido2Assertion,
        }),
      });

      const apiResult = await res.json();
      setResult(apiResult);

      if (!res.ok || !apiResult.success) {
        throw new Error(apiResult.message || '伺服器驗證失敗。');
      }

      setStatusMessage('✅ 授權成功！桌面端應該會自動登入。');
      // 可選擇在短暫延遲後跳轉回手機 App 的主畫面
      setTimeout(() => router.push('/demo/me'), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤。';
      setError(errorMessage);
      setStatusMessage('登入授權失敗。');
    } finally {
      setIsLoading(false);
    }
  }, [qrData, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">確認登入</h1>
          <p className="mt-2 text-lg text-gray-500">您即將在另一台裝置上登入。</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          {qrData ? (
            <button
              onClick={handleLoginConfirm}
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? '處理中...' : '確認並授權登入'}
            </button>
          ) : (
            <p className="text-center text-gray-500">無法讀取 QR Code 資訊。</p>
          )}

          <div className="mt-6">
            <h2 className="mb-3 border-b pb-2 text-lg font-semibold text-gray-700">處理狀態</h2>
            <p className="text-lg font-bold text-gray-800">{statusMessage}</p>
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                <p className="font-bold">錯誤:</p>
                <p className="break-words">{error}</p>
              </div>
            )}
            <ResultDisplay title="QR Code 數據 (模擬)" data={qrData} />
            <ResultDisplay title="伺服器回應" data={result} />
          </div>

          <div className="mt-6 border-t pt-4 text-center">
            <Link href="/demo/auth" className="text-blue-600 hover:underline">
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
