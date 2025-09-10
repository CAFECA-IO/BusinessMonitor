import { SignJWT, jwtVerify, importJWK, type JWK, type JWTPayload } from 'jose';
import { env, parseSessionJwk } from '@/lib/env';

// 可選：單獨的 DeWT 金鑰；缺省時沿用 SESSION_JWK
function getDewtPrivateJwk(): JWK {
  if (process.env.DEWT_JWK && process.env.DEWT_JWK.length > 0) {
    return parseSessionJwk<JWK>(process.env.DEWT_JWK);
  }
  return parseSessionJwk<JWK>(env.SESSION_JWK);
}

function toPublicJwk(priv: JWK): JWK {
  const { kty, crv, x, y } = priv as { kty: 'EC'; crv: 'P-256'; x: string; y: string };
  if (!x || !y) throw new Error('DeWT JWK missing x/y');
  return { kty, crv, x, y };
}

const ALG = 'ES256';
const DEWT_ISS = process.env.DEWT_ISS ?? env.SESSION_ISS ?? 'bm';
const DEWT_AUD = process.env.DEWT_AUD ?? 'bm-dewt';
const DEWT_MAX_AGE_SEC = Number.parseInt(process.env.DEWT_MAX_AGE_SEC ?? '180', 10); // 高風險建議 60~300 秒
const DEWT_KID = process.env.DEWT_KID ?? process.env.SESSION_KID ?? 'bm-dewt';

export type DeWTClaims = {
  sub: string;
  scope: string[];
  amr: ['fido2'];
  acr?: 'low' | 'high';
  credIdHash?: string;
  ncfcid?: string; // 之後可加入合約身分
};

export async function signDeWT(claims: DeWTClaims): Promise<string> {
  const priv = getDewtPrivateJwk();
  const key = await importJWK(priv, ALG);
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: ALG, kid: DEWT_KID, typ: 'DEWT' })
    .setIssuer(DEWT_ISS)
    .setAudience(DEWT_AUD)
    .setNotBefore(now) // 明確 nbf
    .setIssuedAt(now)
    .setExpirationTime(now + DEWT_MAX_AGE_SEC)
    .sign(key);
}

export async function verifyDeWT(token: string): Promise<JWTPayload> {
  const pub = toPublicJwk(getDewtPrivateJwk());
  const key = await importJWK(pub, ALG);
  const { payload } = await jwtVerify(token, key, {
    issuer: DEWT_ISS,
    audience: DEWT_AUD,
  });
  return payload;
}
