import { SignJWT, jwtVerify, importJWK, JWK, JWTPayload } from 'jose';
import crypto from 'crypto';
import { env, parseSessionJwk } from './env';

export type SessionClaims = {
  sub: string; // user id
  scope: string[]; // 權限範圍
};

export type PublicJwk = {
  kty: 'EC';
  crv: 'P-256';
  x: string;
  y: string;
  kid?: string;
  alg?: 'ES256';
  use?: 'sig';
};

export type PrivateJwk = PublicJwk & {
  d: string; // 私鑰成分
};

const privateJwk = parseSessionJwk<PrivateJwk>(env.SESSION_JWK);
privateJwk.alg = 'ES256';
privateJwk.kid = env.SESSION_KID;
privateJwk.use = 'sig';

const ALG = 'ES256' as const;

export async function signSession(claims: SessionClaims): Promise<string> {
  const key = await importJWK(privateJwk as unknown as JWK, ALG);
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();

  return await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: ALG, kid: env.SESSION_KID })
    .setIssuer(env.SESSION_ISS)
    .setAudience(env.SESSION_AUD)
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + env.SESSION_MAX_AGE_SEC)
    .setJti(jti)
    .sign(key);
}

export async function verifySession(token: string): Promise<JWTPayload> {
  // 驗章用同一把 key（正式可切多把，透過 JWKS 旋轉）
  const key = await importJWK(privateJwk as unknown as JWK, ALG);
  const { payload } = await jwtVerify(token, key, {
    issuer: env.SESSION_ISS,
    audience: env.SESSION_AUD,
  });
  return payload;
}

export const COOKIE_NAME = 'bm_sess';

export function buildSessionCookie(token: string): string {
  const parts: string[] = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${env.SESSION_MAX_AGE_SEC}`,
  ];
  if (env.COOKIE_SECURE === 'true') parts.push('Secure');
  if (env.COOKIE_DOMAIN && env.COOKIE_DOMAIN.length > 0) {
    parts.push(`Domain=${env.COOKIE_DOMAIN}`);
  }
  return parts.join('; ');
}

// 匯出公開 JWKS（僅公鑰部分）
export function publicJWKS(): { keys: PublicJwk[] } {
  const { d, ...pub } = privateJwk;
  return { keys: [{ ...(pub as PublicJwk), alg: 'ES256', use: 'sig', kid: env.SESSION_KID }] };
}
