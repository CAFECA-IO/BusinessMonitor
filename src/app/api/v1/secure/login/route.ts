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
import { Credential } from '@prisma/client';

export const runtime = 'nodejs';

/**
 * Info: (20250911 - Tzuhan) 封裝 FIDO2 驗證的核心邏輯
 * @param assertion - 從客戶端收到的 FIDO2 回應
 * @param cred - 從資料庫中取出的憑證紀錄
 * @returns - 驗證成功後的解析資訊
 */
async function verifyFido2Assertion(
  assertion: AuthenticationResponseJSON,
  cred: Credential
): Promise<AuthenticationInfo> {
  // Info: (20250910 - Tzuhan) 3) 準備 verify 參數
  const credentialKey = {
    id: cred.credentialId,
    publicKey: cred.publicKey,
    algorithm: cred.algorithmNamed as NamedAlgo,
    transports: [],
  };

  // Info: (20250911 - Tzuhan) 4) 準備並嘗試多個 challenge 以容忍時鐘誤差
  const now = Date.now();
  const candidates = [
    calcChallengeHex(buildLoginData({ rpId: env.RPID, origin: env.ORIGIN, now })),
    calcChallengeHex(buildLoginData({ rpId: env.RPID, origin: env.ORIGIN, now: now - 60_000 })),
  ];

  let parsed: AuthenticationInfo | null = null;
  let lastError: unknown = null;
  for (const challenge of candidates) {
    try {
      parsed = await fido2Server.verifyAuthentication(assertion, credentialKey, {
        challenge,
        origin: env.ORIGIN,
        userVerified: true,
        counter: cred.counter,
      });
      break;
    } catch (e) {
      lastError = e;
    }
  }

  if (!parsed) {
    const message = lastError instanceof Error ? lastError.message : 'FIDO2 verification failed';
    throw new Error(message);
  }

  // Info: (20250910 - Tzuhan) 5) 嚴格檢查 counter 是否遞增
  if (parsed.counter <= cred.counter) {
    throw new Error('Replay detected');
  }

  return parsed;
}

export async function POST(req: NextRequest) {
  try {
    let assertion: AuthenticationResponseJSON;
    try {
      assertion = await req.json();
    } catch {
      return jsonFail(ApiCode.VALIDATION_ERROR, 'Invalid JSON body');
    }

    // Info: (20250911 - Tzuhan) 1) 取 credentialId
    const credentialId = assertion?.id;
    if (!credentialId) {
      return jsonFail(ApiCode.VALIDATION_ERROR, 'Missing credential id');
    }

    // Info: (20250911 - Tzuhan) 2) DB 取憑證 + 使用者
    const cred = await prisma.credential.findUnique({
      where: { credentialId },
      include: { user: true },
    });
    if (!cred || !cred.user) {
      return jsonFail(ApiCode.NOT_FOUND, 'Credential not found');
    }

    // Info: (20250911 - Tzuhan) 將核心驗證邏輯委託給輔助函式
    const parsedInfo = await verifyFido2Assertion(assertion, cred);

    // Info: (20250911 - Tzuhan) 6) 準備 DeWT claims 並處理 credIdHash
    const isCredIdHashMissing = !cred.credIdHash;
    const credIdHash = isCredIdHashMissing
      ? crypto.createHash('sha256').update(cred.credentialId, 'utf8').digest('hex')
      : cred.credIdHash!;

    // Info: (20250911 - Tzuhan) 7) 將 counter 和 credIdHash 的更新合併為一次資料庫操作
    await prisma.credential.update({
      where: { credentialId: cred.credentialId },
      data: {
        counter: parsedInfo.counter,
        ...(isCredIdHashMissing && { credIdHash }),
      },
    });

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
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Replay detected') {
        return jsonFail(ApiCode.CONFLICT, error.message);
      }
      return jsonFail(ApiCode.UNAUTHENTICATED, error.message);
    }
    return jsonFail(ApiCode.SERVER_ERROR, 'An unknown error occurred');
  }
}
