import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { AppError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { getIdentityFromDeWT } from '@/lib/dewt';

export async function POST(request: NextRequest) {
  try {
    // Info: (20251013 - Tzuhan) 1. 驗證發起請求的使用者身份
    const identity = await getIdentityFromDeWT(request.headers.get('Authorization'));
    if (!identity) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Invalid or missing token.');
    }

    const { sessionId, challenge }: { sessionId: string; challenge: string } = await request.json();
    if (!sessionId || !challenge) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'sessionId and challenge are required.');
    }

    // Info: (20251013 - Tzuhan) 2. 查找 session 並確認其狀態為 PENDING
    const session = await prisma.devicePairingSession.findUnique({ where: { id: sessionId } });
    if (!session || session.status !== 'PENDING') {
      throw new AppError(ApiCode.NOT_FOUND, 'Session not found, expired, or already processed.');
    }

    // Info: (20251013 - Tzuhan) 3. 更新 session 狀態，並關聯使用者與 challenge
    await prisma.devicePairingSession.update({
      where: { id: sessionId },
      data: {
        status: 'AUTHORIZED',
        identityId: identity.id, // Info: (20251013 - Tzuhan) 關聯批准此操作的使用者
        challenge: challenge, // Info: (20251013 - Tzuhan) 儲存 FIDO2 註冊所需的 challenge
      },
    });

    return jsonOk({ message: 'Session authorized successfully.' });
  } catch (error) {
    const isAppError = error instanceof AppError;
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    logger.error('Authorize Pairing Error', { errorMessage: message });
    return jsonFail(isAppError ? (error as AppError).code : ApiCode.SERVER_ERROR, message);
  }
}
