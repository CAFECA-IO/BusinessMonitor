'use client';

import { useState } from 'react';
import { fido2ClientService } from '@/lib/fido2-client';
import { ICoordinates, parsePublicKeyCoordinates } from '@/lib/fido2-parse';
import type { IApiResponse } from '@/lib/response';
import type { RegisterOptions, RegistrationJSON } from '@passwordless-id/webauthn/dist/esm/types';
type IApiSuccessResponse = IApiResponse<RegisterOptions>;
type StatusType = 'idle' | 'loading' | 'success' | 'error';

export default function PocRegisterAndParsePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [xyCoords, setXyCoords] = useState<ICoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to begin PoC 1.1 + 1.2');
  const [statusType, setStatusType] = useState<StatusType>('idle');

  const addLog = (log: string) => {
    // Info: (20251111 - Tzuhan) PoC 階段允許 console.log
    console.log(log);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setXyCoords(null);
    setLogs([]);
    setStatusMessage('Loading...');
    setStatusType('loading');

    try {
      // Info: (20251111 - Tzuhan) 1. 呼叫我們現有的 API Route
      addLog(
        'Fetching registration options from /api/v1/secure/webauthn-options?intent=register ...'
      );
      const response = await fetch('/api/v1/secure/webauthn-options?intent=register');

      const apiResponse: IApiSuccessResponse | IApiResponse<null> = await response.json();

      if (!response.ok || !apiResponse.success || !apiResponse.payload) {
        throw new Error((apiResponse as IApiResponse<null>).message || 'Failed to fetch options');
      }

      const options: RegisterOptions = apiResponse.payload;
      addLog('Successfully fetched options.');

      // Info: (20251112 - Tzuhan) 2. [PoC 1-1 AC #2] 呼叫現有的 fido2ClientService
      addLog('Calling fido2ClientService.startRegistration()...');
      setStatusMessage('Please create your Passkey in the browser prompt...');
      const credential: RegistrationJSON = await fido2ClientService.startRegistration(options);
      addLog('Passkey created successfully!');
      // Info: (20251112 - Tzuhan) [PoC 1-2 AC #1] (隱含) 註冊完成後，函式被觸發

      // Info: (20251112 - Tzuhan) --- [PoC 1-2 驗收標準 (AC) 從這裡開始] ---
      const attestationObjectBase64 = credential.response.attestationObject;
      if (!attestationObjectBase64) {
        throw new Error('attestationObject is missing from credential response.');
      }

      // Info: (20251112 - Tzuhan) 3. [PoC 1-2 AC #2] 呼叫 PoC 1-2 核心實作
      addLog('Parsing attestationObject to find public key coordinates...');
      setStatusMessage('Parsing coordinates...');
      const coords = parsePublicKeyCoordinates(attestationObjectBase64);

      if (coords) {
        // Info: (20251112 - Tzuhan) 4. [PoC 1-2 AC #3] 瀏覽器 console.log 正確輸出了 { x: '...', y: '...' }
        addLog(`SUCCESS! Found coordinates. x: ${coords.x}, y: ${coords.y}`);
        setXyCoords(coords);
        setStatusMessage('✅ PoC 1.2 Success!');
        setStatusType('success');
      } else {
        throw new Error('Failed to parse coordinates from attestationObject.');
      }
      // Info: (20251112 - Tzuhan) --- [PoC 1-2 驗收標準 (AC) 到這裡結束] ---
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          addLog('ERROR: User cancelled the FIDO2 operation.');
          setStatusMessage('❌ Operation canceled by user.');
        } else {
          addLog(`ERROR: ${error.message}`);
          setStatusMessage('❌ PoC Failed');
        }
      } else {
        addLog('ERROR: An unknown error occurred.');
        setStatusMessage('❌ PoC Failed');
      }
      setXyCoords(null);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'loading':
        return 'text-blue-600';
      case 'idle':
      default:
        return 'text-gray-800';
    }
  };

  // Info: (20251112 - Tzuhan) [PoC 1-1 AC #1] Next.js 頁面成功渲染
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 antialiased sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            [PoC 1-1] + [PoC 1-2]
          </h1>
          <p className="mt-2 text-lg text-gray-600">Passkey 註冊與公鑰解析</p>
        </div>

        <div className="flex flex-col items-center rounded-xl bg-white p-8 shadow-lg">
          <button
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full max-w-xs rounded-lg bg-purple-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isLoading ? 'Processing...' : 'Register New Passkey (PoC 1.1 + 1.2)'}
          </button>
          <p className="mt-4 text-xs text-gray-500">
            [PoC 1-1] 觸發註冊 <br />
            [PoC 1-2] 解析 attestationObject
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-3 border-b pb-2 text-lg font-semibold text-gray-700">
            Verification Status
          </h2>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500">Status:</p>
            <p className={`text-lg font-bold ${getStatusColor(statusType)}`}>{statusMessage}</p>
          </div>

          {xyCoords && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <h2 className="font-bold text-green-700">
                ✅ [PoC 1-2] 成功提取 P-256 座標 (Happy Path)
              </h2>
              <p className="mt-2 break-all text-xs">
                <strong>X (base64url):</strong> {xyCoords.x}
              </p>
              <p className="mt-1 break-all text-xs">
                <strong>Y (base64url):</strong> {xyCoords.y}
              </p>
            </div>
          )}

          <h3 className="mt-4 text-sm font-medium text-gray-500">Logs:</h3>
          <pre
            style={{
              backgroundColor: '#f4f4f4',
              border: '1px solid #ccc',
              padding: '10px',
              maxHeight: '400px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {logs.join('\n')}
          </pre>
        </div>
      </div>
    </main>
  );
}
