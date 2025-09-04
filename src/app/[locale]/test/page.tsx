'use client';

// ToDo: (20250904 - Luphia) lib/cafeca 函式庫的實驗頁面，完成開發後應刪除此檔案
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getChallenge, getUserData, verifyUser } from '@/lib/cafeca';
import type { RegistrationJSON, RegistrationInfo } from '@passwordless-id/webauthn/dist/esm/types';

// Info: (20250904 - Luphia) 定義泛用 JSON 型別
type JsonPrimative = string | number | boolean | null;
export type JsonArray = Json[];
export type JsonObject = { [key: string]: Json };
export type JsonComposite = JsonArray | JsonObject;
export type Json = JsonPrimative | JsonComposite;
export type Fido2ExpectedData = {
  challenge: string;
  origin: string;
  userVerified: boolean;
  counter: number;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function useSecureContextInfo() {
  const [secure, setSecure] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      setSecure(!!(typeof window !== 'undefined' && (window.isSecureContext || isLocal)));
    } catch {
      setSecure(null);
    }
  }, []);
  return secure;
}

export function WebAuthnSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported('PublicKeyCredential' in window);
  }, []);

  if (supported === null) {
    return null; // SSR 時不輸出，避免 mismatch
  }

  return supported ? (
    <span className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-sky-700">
      WebAuthn 支援
    </span>
  ) : (
    <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-700">
      瀏覽器不支援 WebAuthn
    </span>
  );
}

export default function WebAuthnPlaygroundPage() {
  const secure = useSecureContextInfo();

  const [loginDataInput, setLoginDataInput] = useState<string>(() => {
    return pretty({
      email: 'user@example.com',
      time: new Date().toISOString(),
      note: '這個物件會被 JSON.stringify 後餵給 getChallenge()',
    });
  });

  const loginData: Json | null = useMemo(() => {
    try {
      return JSON.parse(loginDataInput);
    } catch {
      return null;
    }
  }, [loginDataInput]);

  const [challenge, setChallenge] = useState<string>('');
  const [userData, setUserData] = useState<RegistrationJSON | null>(null);
  const [expectedData, setExpectedData] = useState<Fido2ExpectedData | null>(null);
  const [verifyResult, setVerifyResult] = useState<RegistrationInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRegister =
    !!loginData &&
    secure !== false &&
    typeof window !== 'undefined' &&
    'PublicKeyCredential' in window;
  const canVerify = !!userData && !!expectedData;

  const runGetChallenge = useCallback(async () => {
    setError(null);
    setVerifyResult(null);
    if (!loginData) {
      setError('JSON 無法解析，請修正輸入資料');
      return;
    }
    setBusy(true);
    try {
      const c = await getChallenge(loginData);
      setChallenge(c);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [loginData]);

  const runRegister = useCallback(async () => {
    setError(null);
    setVerifyResult(null);
    if (!loginData) {
      setError('JSON 無法解析，請修正輸入資料');
      return;
    }
    if (!canRegister) {
      setError('此環境不支援 WebAuthn（需要 https 或 localhost，且瀏覽器須支援 Credential API）');
      return;
    }
    setBusy(true);
    try {
      const [ud, exp] = await getUserData(loginData);
      setUserData(ud);
      setExpectedData(exp);
      setChallenge(exp.challenge);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [loginData, canRegister]);

  const runVerify = useCallback(async () => {
    setError(null);
    if (!userData || !expectedData) return;
    setBusy(true);
    try {
      const res = await verifyUser(userData, expectedData);
      setVerifyResult(res);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [userData, expectedData]);

  const resetAll = useCallback(() => {
    setChallenge('');
    setUserData(null);
    setExpectedData(null);
    setVerifyResult(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            WebAuthn 測試頁面（Passwordless.id）
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${secure ? 'border-green-300 bg-green-50 text-green-700' : secure === false ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 bg-white text-gray-700'}`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: secure ? '#16a34a' : secure === false ? '#dc2626' : '#9ca3af',
                }}
              />
              {secure
                ? 'Secure Context OK'
                : secure === false
                  ? '非安全情境（請用 https 或 localhost）'
                  : '檢查中...'}
            </span>
            <WebAuthnSupport />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Info: (20250904 - Luphia) 左側：輸入與動作 */}
          <section className="space-y-4">
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-4 py-3">
                <h2 className="text-lg font-medium">1) 輸入 loginData（JSON）</h2>
                <p className="text-sm text-gray-500">
                  這個物件會被 <code>JSON.stringify</code> 後做 <code>sha256</code>，作為註冊/驗證的
                  challenge。
                </p>
              </div>
              <div className="p-4">
                <textarea
                  className="min-h-[180px] w-full rounded-xl border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={loginDataInput}
                  onChange={(e) => setLoginDataInput(e.target.value)}
                  spellCheck={false}
                />
                {loginData === null && (
                  <p className="mt-2 text-sm text-red-600">JSON 解析失敗，請檢查格式。</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={runGetChallenge}
                    disabled={!loginData || busy}
                    className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    產生 Challenge
                  </button>
                  <button
                    onClick={runRegister}
                    disabled={!canRegister || busy || !loginData}
                    className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    title="需在使用者手動點擊下觸發，瀏覽器會跳出平台驗證器 UI"
                  >
                    呼叫 client.register（取得使用者資料）
                  </button>
                  <button
                    onClick={resetAll}
                    disabled={busy}
                    className="rounded-xl border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    重設
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-4 py-3">
                <h2 className="text-lg font-medium">2) 驗證（server.verifyRegistration）</h2>
                <p className="text-sm text-gray-500">※ 僅作為 Demo，實務上應在伺服器端執行驗證。</p>
              </div>
              <div className="p-4">
                <button
                  onClick={runVerify}
                  disabled={!canVerify || busy}
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  驗證註冊結果（verifyRegistration）
                </button>
                {!canVerify && (
                  <p className="mt-2 text-sm text-gray-500">
                    需先完成「取得使用者資料」以取得 <code>userData</code> 與{' '}
                    <code>expectedData</code>。
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Info: (20250904 - Luphia) 右側：輸出結果 */}
          <section className="space-y-4">
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-lg font-medium">Challenge（hex）</h2>
                {challenge && (
                  <button
                    className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                    onClick={() => navigator.clipboard.writeText(challenge)}
                  >
                    複製
                  </button>
                )}
              </div>
              <div className="p-4">
                <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                  {challenge || '—'}
                </pre>
              </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-lg font-medium">userData（RegistrationJSON）</h2>
                {userData && (
                  <button
                    className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                    onClick={() => navigator.clipboard.writeText(pretty(userData))}
                  >
                    複製 JSON
                  </button>
                )}
              </div>
              <div className="p-4">
                <pre className="max-h-72 overflow-auto font-mono text-sm">
                  {userData ? pretty(userData) : '—'}
                </pre>
              </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-lg font-medium">expectedData（Fido2ExpectedData）</h2>
                {expectedData && (
                  <button
                    className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                    onClick={() => navigator.clipboard.writeText(pretty(expectedData))}
                  >
                    複製 JSON
                  </button>
                )}
              </div>
              <div className="p-4">
                <pre className="max-h-64 overflow-auto font-mono text-sm">
                  {expectedData ? pretty(expectedData) : '—'}
                </pre>
              </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-lg font-medium">verifyRegistration 結果</h2>
                {verifyResult && (
                  <button
                    className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                    onClick={() => navigator.clipboard.writeText(pretty(verifyResult))}
                  >
                    複製 JSON
                  </button>
                )}
              </div>
              <div className="p-4">
                <pre className="max-h-72 overflow-auto font-mono text-sm">
                  {verifyResult ? pretty(verifyResult) : '—'}
                </pre>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800">
                <div className="font-medium">錯誤</div>
                <pre className="mt-1 whitespace-pre-wrap break-words text-sm">{error}</pre>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-8 text-sm text-gray-500">
          <p>
            提示：<strong>localhost</strong> 被瀏覽器視為安全情境，可直接在{' '}
            <code>http://localhost:3000</code> 測試。部署時請使用 HTTPS 網域，並確保{' '}
            <code>expectedData.origin</code> 與實際來源一致。
          </p>
          <p className="mt-1">
            此頁面僅供測試。正式環境請改在伺服器上執行 <code>server.verifyRegistration</code>。
          </p>
        </footer>
      </div>
    </div>
  );
}
function pretty(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
