import { NextRequest } from 'next/server';
import { server as fido2Server } from '@passwordless-id/webauthn';
import type {
  AuthenticationResponseJSON,
  AuthenticationInfo,
  NamedAlgo,
} from '@passwordless-id/webauthn/dist/esm/types';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { prisma } from '@/lib/prisma';
import { buildLoginData, calcChallengeHex } from '@/lib/challenge';
import { signDeWT, type DeWTClaims } from '@/lib/dewt';
import { env } from '@/lib/env';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let assertion: AuthenticationResponseJSON;
  try {
    assertion = await req.json();
  } catch {
    return jsonFail(ApiCode.VALIDATION_ERROR, 'Invalid JSON body');
  }

  // Info: (20250910 - Tzuhan) 1) 取 credentialId（userHandle 可有可無，不依賴它）
  const credentialId = assertion?.id;
  if (!credentialId) {
    return jsonFail(ApiCode.VALIDATION_ERROR, 'Missing credential id');
  }

  // Info: (20250910 - Tzuhan) 2) DB 取憑證 + 使用者
  const cred = await prisma.credential.findUnique({
    where: { credentialId },
    include: { user: true },
  });
  if (!cred || !cred.user) {
    return jsonFail(ApiCode.NOT_FOUND, 'Credential not found');
  }

  // Info: (20250910 - Tzuhan) 3) 準備 verify 參數
  const credentialKey = {
    id: cred.credentialId,
    publicKey: cred.publicKey,
    algorithm: cred.algorithmNamed as NamedAlgo,
    transports: [],
  };

  // Info: (20250910 - Tzuhan) 挑戰允許 60 秒滑窗（now 與 now-60s）
  const now = Date.now();
  const candidates = [
    calcChallengeHex(buildLoginData({ rpId: env.RPID, origin: env.ORIGIN, now })),
    calcChallengeHex(buildLoginData({ rpId: env.RPID, origin: env.ORIGIN, now: now - 60_000 })),
  ];

  // Info: (20250910 - Tzuhan) 4) 嘗試兩個 challenge 驗章（任一成功即通過）
  let parsed: AuthenticationInfo | null = null;
  let lastError: unknown = null;
  for (const challenge of candidates) {
    try {
      parsed = await fido2Server.verifyAuthentication(assertion, credentialKey, {
        challenge,
        origin: env.ORIGIN,
        userVerified: true,
        counter: cred.counter, // Info: (20250910 - Tzuhan) 期望 > DB 值
      });
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!parsed) {
    const message = lastError instanceof Error ? lastError.message : 'FIDO2 verification failed';
    return jsonFail(ApiCode.UNAUTHENTICATED, message);
  }

  // Info: (20250910 - Tzuhan) 5) 嚴格檢查遞增（雙保險）
  if (parsed.counter <= cred.counter) {
    return jsonFail(ApiCode.CONFLICT, 'Replay detected');
  }

  await prisma.credential.update({
    where: { credentialId: cred.credentialId },
    data: { counter: parsed.counter },
  });

  // Info: (20250910 - Tzuhan) 6) 準備 DeWT claims
  const credIdHash =
    cred.credIdHash ?? crypto.createHash('sha256').update(cred.credentialId, 'utf8').digest('hex');

  if (!cred.credIdHash) {
    await prisma.credential.update({
      where: { credentialId: cred.credentialId },
      data: { credIdHash },
    });
  }

  const claims: DeWTClaims = {
    sub: cred.userId,
    scope: ['user'],
    amr: ['fido2'],
    credIdHash,
  };
  const dewt = await signDeWT(claims);

  return jsonOk({
    dewt,
    user: { id: cred.user.id, email: cred.user.email },
  });
}
