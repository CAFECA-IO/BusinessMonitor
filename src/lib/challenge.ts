import { createHash } from 'node:crypto';

export type ChallengeBase = {
  tag: 'LOGIN'; // Info: (20250910 - Tzuhan) 可擴充其它用途
  t: number; // Info: (20250910 - Tzuhan) time window（秒）＝ Math.floor(now/60)
  rpId: string; // Info: (20250910 - Tzuhan) 必須與 WebAuthn rpId 一致
  origin: string; // Info: (20250910 - Tzuhan) 必須與 WebAuthn origin 一致
  nonce?: string; // Info: (20250910 - Tzuhan) FE 可自行加隨機字串（可選）
  uidHint?: string; // Info: (20250910 - Tzuhan) email/username 提示（可選）
};

// Info: (20250910 - Tzuhan) 以「鍵名排序」做穩定 JSON 序列化，避免不同環境順序差異
export function stableStringify(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort();
  const kv = keys.map((k) => {
    const v = (obj as Record<string, unknown>)[k];
    return `"${k}":${typeof v === 'string' ? JSON.stringify(v) : String(v)}`;
  });
  return `{${kv.join(',')}}`;
}

export function buildLoginData(params: {
  rpId: string;
  origin: string;
  uidHint?: string;
  nonce?: string;
  now?: number; // Info: (20250910 - Tzuhan) 測試用（毫秒）
}): ChallengeBase {
  const now = typeof params.now === 'number' ? params.now : Date.now();
  return {
    tag: 'LOGIN',
    t: Math.floor(now / 1000 / 60), // Info: (20250910 - Tzuhan) 分鐘窗
    rpId: params.rpId,
    origin: params.origin,
    uidHint: params.uidHint,
    nonce: params.nonce,
  };
}

export function calcChallengeHex(loginData: ChallengeBase): string {
  const json = stableStringify(loginData as unknown as Record<string, unknown>);
  const h = createHash('sha256').update(json, 'utf8').digest('hex');
  return h;
}
