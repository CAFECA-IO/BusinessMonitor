import { SignJWT, jwtVerify, importJWK, type JWK, type JWTPayload } from 'jose';
import { env, parseSessionJwk } from '@/lib/env';

const ALG = 'ES256';
export const COOKIE_NAME = 'bm_sess';

export type SessionClaims = {
  sub: string;
  scope: string[];
  amr: ['fido2'];
  acr?: 'low';
  credIdHash?: string;
};

// 從私鑰 JWK 推導公鑰 JWK（去掉 d，保留 x/y/crv/kty）
function toPublicJwk(priv: JWK): JWK {
  const { kty, crv, x, y } = priv as { kty: 'EC'; crv: 'P-256'; x: string; y: string };
  if (!x || !y) throw new Error('SESSION_JWK missing x/y');
  return { kty, crv, x, y };
}

export async function signSession(claims: SessionClaims): Promise<string> {
  const privateJwk = parseSessionJwk<JWK>(env.SESSION_JWK);
  const key = await importJWK(privateJwk, ALG); // 用私鑰簽章
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: ALG, kid: env.SESSION_KID, typ: 'JWT' })
    .setIssuer(env.SESSION_ISS)
    .setAudience(env.SESSION_AUD)
    .setIssuedAt()
    .setExpirationTime(`${env.SESSION_MAX_AGE_SEC}s`)
    .sign(key);
}

export async function verifySession(token: string): Promise<JWTPayload> {
  const privateJwk = parseSessionJwk<JWK>(env.SESSION_JWK);
  const publicJwk = toPublicJwk(privateJwk);
  const key = await importJWK(publicJwk, ALG); // 用公鑰驗章（重點）
  const { payload } = await jwtVerify(token, key, {
    issuer: env.SESSION_ISS,
    audience: env.SESSION_AUD,
  });
  return payload;
}

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

// 匯出公開 JWKS（僅公鑰部分）
export function publicJWKS(): { keys: PublicJwk[] } {
  const { d, ...pub } = privateJwk;
  return { keys: [{ ...(pub as PublicJwk), alg: 'ES256', use: 'sig', kid: env.SESSION_KID }] };
}
