import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { IdentityAccount } from '@prisma/client';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const issuer = 'urn:cafeca:api';
const audience = 'urn:cafeca:app';
const expirationTime = '8h';

export const signDeWT = async (identityAccount: IdentityAccount): Promise<string> => {
  const dewt = await new SignJWT({ scope: ['user'] })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(identityAccount.id)
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(expirationTime)
    .setIssuedAt()
    .sign(secret);
  return dewt;
};

export const verifyDeWT = async (dewt: string): Promise<JWTPayload> => {
  const { payload } = await jwtVerify(dewt, secret, { issuer, audience });
  return payload;
};
