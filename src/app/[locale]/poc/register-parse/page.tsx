'use client';

import { useState } from 'react';
import { fido2ClientService } from '@/lib/fido2-client'; //
import { ICoordinates, parsePublicKeyCoordinates } from '@/lib/poc-parse.utils';
import type { RegisterOptions, RegistrationJSON } from '@passwordless-id/webauthn/dist/esm/types';

// Info: (20251111 - Tzuhan) 定義 API 錯誤回傳的介面 (符合 IPascalCase)
interface IApiError {
  error: string;
}

export default function PocRegisterAndParsePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [xyCoords, setXyCoords] = useState<ICoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (log: string) => {
    // Info: (20251111 - Tzuhan) PoC 階段允許 console.log
    console.log(log);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setXyCoords(null);
    setLogs([]);

    try {
      // Info: (20251111 - Tzuhan) 1. 呼叫我們現有的 API Route
      addLog(
        'Fetching registration options from /api/v1/secure/webauthn-options?intent=register ...'
      );
      const response = await fetch('/api/v1/secure/webauthn-options?intent=register');

      const options: RegisterOptions | IApiError = await response.json();

      if (!response.ok || 'error' in options) {
        throw new Error((options as IApiError).error || 'Failed to fetch options');
      }
      addLog('Successfully fetched options.');

      // Info: (20251111 - Tzuhan) 2. 呼叫現有的 fido2ClientService
      addLog('Calling fido2ClientService.startRegistration()...');
      const credential: RegistrationJSON = await fido2ClientService.startRegistration(options);
      addLog('Passkey created successfully!');

      // Info: (20251111 - Tzuhan) 3. 提取 Attestation Object
      const attestationObjectBase64 = credential.response.attestationObject;
      if (!attestationObjectBase64) {
        throw new Error('attestationObject is missing from credential response.');
      }

      // Info: (20251111 - Tzuhan) 4. 呼叫 PoC 1.2 解析函式
      addLog('Parsing attestationObject to find public key coordinates...');
      const coords = parsePublicKeyCoordinates(attestationObjectBase64);

      if (coords) {
        addLog(`SUCCESS! Found coordinates.`);
        setXyCoords(coords);
      } else {
        throw new Error('Failed to parse coordinates from attestationObject.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          addLog('ERROR: User cancelled the FIDO2 operation.');
        } else {
          addLog(`ERROR: ${error.message}`);
        }
      } else {
        addLog('ERROR: An unknown error occurred.');
      }
      setXyCoords(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>PoC 1.1 + 1.2: Passkey 註冊與公鑰解析</h1>
      <p>
        此頁面將呼叫 <strong>GET /api/v1/secure/webauthn-options?intent=register</strong>, 然後使用{' '}
        <strong>fido2ClientService.startRegistration()</strong>, 最後解析回傳的{' '}
        <strong>attestationObject</strong>
        來提取 P-256 公鑰的 x, y 座標。
      </p>
      <button
        onClick={handleRegister}
        disabled={isLoading}
        style={{ fontSize: '16px', padding: '10px' }}
      >
        {isLoading ? 'Processing...' : 'Register New Passkey & Parse Coordinates'}
      </button>

      {xyCoords && (
        <div style={{ marginTop: '20px', backgroundColor: '#dfd', padding: '10px' }}>
          <h2>✅ 成功提取 P-256 座標</h2>
          <p>
            <strong>X (base64url):</strong> {xyCoords.x}
          </p>
          <p>
            <strong>Y (base64url):</strong> {xyCoords.y}
          </p>
          <p>(這些值現在可以發送到 PoC 3a 的智能合約中)</p>
        </div>
      )}

      <h3>Logs:</h3>
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
  );
}
