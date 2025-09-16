import { DEWT_JWK, DEWT_KID, DEWT_AUD, DEWT_MAX_AGE_SEC, DEWT_ISS } from '@/constants/dewt';
import { SignJWT, jwtVerify, importJWK, type JWK, type JWTPayload } from 'jose';

const ALG = 'ES256';

// Info: (20250910 - Tzuhan) 用於解析 base64url 或 JSON 格式的 JWK
export function parseB64uJwk<T extends object = Record<string, unknown>>(raw: string): T {
  try {
    // Info: (20250910 - Tzuhan) 優先嘗試直接解析 JSON
    return JSON.parse(raw) as T;
  } catch {
    // Info: (20250910 - Tzuhan) 否則視為 base64url 處理
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const jsonStr = Buffer.from(b64 + pad, 'base64').toString('utf8');
    return JSON.parse(jsonStr) as T;
  }
}

// Info: (20250910 - Tzuhan) 惰性載入，只在需要時解析一次 JWK
let privateJwk: JWK | null = null;
function getPriv(): JWK {
  if (!privateJwk) {
    privateJwk = parseB64uJwk(DEWT_JWK!);
  }
  return privateJwk;
}

function toPub(priv: JWK): JWK {
  const { kty, crv, x, y } = priv as { kty: 'EC'; crv: 'P-256'; x: string; y: string };
  if (!kty || !crv || !x || !y) throw new Error('Invalid EC private JWK for public key conversion');
  return { kty, crv, x, y };
}

export type DeWTClaims = {
  sub: string;
  scope: string[];
  amr: ['fido2']; // Info: (20250910 - Tzuhan) 只允許 FIDO2 來源
  acr?: 'low' | 'high';
  credIdHash?: string | null; // Info: (20250910 - Tzuhan) 裝置綁定（可選）
  ncfcid?: string; // Info: (20250910 - Tzuhan) 之後要串鏈上身份可用
};

export async function signDeWT(claims: DeWTClaims): Promise<string> {
  const key = await importJWK(getPriv(), ALG);
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: ALG, kid: DEWT_KID, typ: 'DEWT' }) // Info: (20250910 - Tzuhan) <-- 使用 env
    .setIssuer(DEWT_ISS!) // Info: (20250910 - Tzuhan) <-- 使用 env
    .setAudience(DEWT_AUD!) // Info: (20250910 - Tzuhan) <-- 使用 env
    .setNotBefore(now)
    .setIssuedAt(now)
    .setExpirationTime(now + DEWT_MAX_AGE_SEC!) // Info: (20250910 - Tzuhan) <-- 使用 env
    .sign(key);
}

export async function verifyDeWT(token: string): Promise<JWTPayload & DeWTClaims> {
  const key = await importJWK(toPub(getPriv()), ALG);
  const { payload } = await jwtVerify(token, key, {
    issuer: DEWT_ISS, // Info: (20250910 - Tzuhan) <-- 使用 env
    audience: DEWT_AUD, // Info: (20250910 - Tzuhan) <-- 使用 env
  });

  const amr = Array.isArray(payload.amr) ? payload.amr : [];
  if (!amr.includes('fido2')) {
    throw new Error('Login method not allowed, "fido2" AMR is required');
  }
  return payload as JWTPayload & DeWTClaims;
}
