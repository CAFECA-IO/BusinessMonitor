import { createHash } from 'node:crypto';

type JsonValue = string | number | boolean | null | undefined;

export type ChallengeBase = {
  tag: 'LOGIN'; // Info: (20250910 - Tzuhan) 可擴充其它用途
  t: number; // Info: (20250910 - Tzuhan) time window（秒）＝ Math.floor(now/60)
  rpId: string; // Info: (20250910 - Tzuhan) 必須與 WebAuthn rpId 一致
  origin: string; // Info: (20250910 - Tzuhan) 必須與 WebAuthn origin 一致
  nonce?: string; // Info: (20250910 - Tzuhan) FE 可自行加隨機字串（可選）
  uidHint?: string; // Info: (20250910 - Tzuhan) email/username 提示（可選）
};

/**
 * Info: (20250911 - Tzuhan) 以「鍵名排序」做穩定 JSON 序列化。
 * 這個版本能更安全地處理不同的 JS 原始型別，並會忽略 undefined 的值。
 * @param obj - 要序列化的物件
 * @returns - 穩定排序後的 JSON 字串
 */
export function stableStringify(obj: Record<string, JsonValue>): string {
  const allKeys = Object.keys(obj);
  const kvPairs: string[] = [];

  // Info: (20250911 - Tzuhan) 依字母順序排序鍵名
  allKeys.sort();

  for (const key of allKeys) {
    const value = obj[key];
    // Info: (20250911 - Tzuhan) 模仿 JSON.stringify 的行為：完全忽略值為 undefined 的鍵
    if (value === undefined) {
      continue;
    }
    // Info: (20250911 - Tzuhan) 使用 JSON.stringify 處理所有值，以確保字串、數字、布林、null 等型別都被正確格式化
    kvPairs.push(`"${key}":${JSON.stringify(value)}`);
  }
  return `{${kvPairs.join(',')}}`;
}
export function buildLoginData(params: {
  rpId: string;
  origin: string;
  uidHint?: string;
  nonce?: string;
  now?: number; // Info: (20250910 - Tzuhan) 測試用（毫秒）
}): ChallengeBase {
  const now = typeof params.now === 'number' ? params.now : Date.now();
  const data: ChallengeBase = {
    tag: 'LOGIN',
    t: Math.floor(now / 1000 / 60),
    rpId: params.rpId,
    origin: params.origin,
  };

  // Info: (20250911 - Tzuhan) 僅在有值時才附加可選屬性，避免傳入 undefined
  if (params.uidHint) {
    data.uidHint = params.uidHint;
  }
  if (params.nonce) {
    data.nonce = params.nonce;
  }

  return data;
}

export function calcChallengeHex(loginData: ChallengeBase): string {
  const json = stableStringify(loginData);
  return createHash('sha256').update(json, 'utf8').digest('hex');
}

/**
 * Info: (20250911 - Tzuhan) 將建立資料和計算雜湊兩步合併。
 * @param params - 建立 Challenge 所需的參數
 * @returns - 最終的 challenge 十六進位字串
 */
export function buildChallenge(params: {
  rpId: string;
  origin: string;
  uidHint?: string;
  nonce?: string;
  now?: number;
}): string {
  const loginData = buildLoginData(params);
  return calcChallengeHex(loginData);
}
