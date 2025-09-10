import { SignJWT, jwtVerify, importJWK, JWK } from 'jose';
import crypto from 'crypto';
import { env, parseSessionJwk } from './env';

const ALG = 'ES256' as const;
const privateJwk = Object.assign(parseSessionJwk(env.SESSION_JWK), {
  alg: ALG,
  kid: env.SESSION_KID,
});

export type ChallengeKind = 'register' | 'login';
export type ChallengeTicket = { token: string; challengeHex: string; expiresAt: number };

export async function issueChallenge(kind: ChallengeKind, ttlSec = 120): Promise<ChallengeTicket> {
  const challengeHex = crypto.randomBytes(32).toString('hex');
  const key = await importJWK(privateJwk as unknown as JWK, ALG);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlSec;

  const token = await new SignJWT({ typ: 'challenge', kind, challenge: challengeHex })
    .setProtectedHeader({ alg: ALG, kid: env.SESSION_KID })
    .setIssuer(env.SESSION_ISS)
    .setAudience(`${env.SESSION_AUD}:${kind}`)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(key);

  return { token, challengeHex, expiresAt: exp };
}

export async function verifyChallenge(kind: ChallengeKind, token: string): Promise<string> {
  const key = await importJWK(privateJwk as unknown as JWK, ALG);
  const { payload } = await jwtVerify(token, key, {
    issuer: env.SESSION_ISS,
    audience: `${env.SESSION_AUD}:${kind}`,
  });
  if (
    payload.typ !== 'challenge' ||
    payload.kind !== kind ||
    typeof payload.challenge !== 'string'
  ) {
    throw new Error('Invalid challenge ticket');
  }
  return payload.challenge;
}
