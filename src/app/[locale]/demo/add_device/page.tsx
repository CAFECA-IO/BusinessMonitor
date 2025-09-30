'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import Link from 'next/link';

export default function QrLoginPage() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('正在連線至伺服器...');
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Info: (20250930 - Tzuhan) 使用 'ws://' 或 'wss://' 取決於環境
    const wsUrl =
      process.env.NODE_ENV === 'production'
        ? `wss://${window.location.host}/ws`
        : // 注意: 開發環境下，WS 伺服器在不同埠
          `ws://localhost:3001/ws`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setStatusMessage('連線成功！正在取得 QR Code...');
      // Info: (20250930 - Tzuhan) 連線成功後，請求 QR Code
      ws.current?.send(JSON.stringify({ type: 'REQUEST_QR_CODE' }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'QR_CODE_DATA':
          setStatusMessage('請使用您的手機 App 掃描 QR Code 以登入。');
          const qrPayload = JSON.stringify(data.payload);
          QRCode.toDataURL(qrPayload, { width: 300 })
            .then((url) => setQrCodeDataUrl(url))
            .catch((err) => {
              console.error(err);
              setError('無法生成 QR Code。');
            });
          break;

        case 'LOGIN_SUCCESS':
          setStatusMessage('驗證成功！即將將您導向儀表板...');
          localStorage.setItem('dewt', data.payload.dewt);
          setTimeout(() => {
            router.push('/demo/me');
          }, 1500);
          break;

        case 'LOGIN_ERROR':
          setError(data.payload.message || '登入失敗或已逾時。');
          setStatusMessage('請重新整理頁面再試一次。');
          setQrCodeDataUrl(''); // 清除舊的 QR Code
          break;

        case 'ERROR':
          setError(data.payload.message || '發生未知錯誤。');
          break;
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      if (!localStorage.getItem('dewt')) {
        // Info: (20250930 - Tzuhan) 如果不是因為成功登入而關閉，就顯示提示
        setStatusMessage('連線已中斷。');
      }
    };

    ws.current.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('無法建立安全連線。請確認後端 WebSocket 伺服器是否正在運行。');
    };

    // Info: (20250930 - Tzuhan) 組件卸載時，清理 WebSocket 連線
    return () => {
      ws.current?.close();
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
            <div className="text-gray-400">正在載入 QR Code...</div>
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
