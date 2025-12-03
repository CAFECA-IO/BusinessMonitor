import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { AppError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { getIdentityFromDeWT, signDeWT } from '@/lib/dewt';
import { getPusherInstance } from '@/lib/pusher';
import { Authenticator } from '@prisma/client';

export async function POST(request: NextRequest) {
  const pusherServer = getPusherInstance();

  try {
    const identity = await getIdentityFromDeWT(request.headers.get('Authorization'));
    if (!identity) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Invalid or missing token.');
    }

    const { sessionId, challenge }: { sessionId: string; challenge: string } = await request.json();
    if (!sessionId || !challenge) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'sessionId and challenge are required.');
    }

    const session = await prisma.devicePairingSession.findUnique({ where: { id: sessionId } });

    logger.info('[Authorize] Session found', {
      id: session?.id || 'N/A',
      status: session?.status || 'N/A',
      hasPendingData: !!session?.pendingCandidateData,
    });

    if (!session || session.status === 'COMPLETED' || session.status === 'EXPIRED') {
      throw new AppError(ApiCode.NOT_FOUND, 'Session not found, expired, or already processed.');
    }

    // Info: (20251203 - Tzuhan) [PoC 4] Add Device 流程
    if (challenge === 'poc4-authorized' && session.pendingCandidateData) {
      const candidateData = session.pendingCandidateData as unknown as Authenticator;

      // Info: (20251203 - Tzuhan) [Debug Log] 印出準備寫入的資料
      logger.info('[Authorize] Writing new authenticator to DB', {
        credentialID: candidateData.credentialID,
        userHandle: candidateData.userHandle,
      });

      // Info: (20251203 - Tzuhan) 1. 寫入 Authenticator 表
      try {
        await prisma.authenticator.create({
          data: {
            credentialID: candidateData.credentialID,
            credentialPublicKey: candidateData.credentialPublicKey,
            counter: BigInt(candidateData.counter || 0),
            algorithm: candidateData.algorithm,
            userHandle: candidateData.userHandle,
            label: candidateData.label || 'New Device', // Info: (20251203 - Tzuhan) 確保有 label
            identityAccount: { connect: { id: identity.id } },
          },
        });
        logger.info('[Authorize] DB write success');
      } catch (dbError) {
        logger.error('[Authorize] DB write failed', {
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
        throw new AppError(ApiCode.SERVER_ERROR, 'Failed to save new device to database.');
      }

      // Info: (20251203 - Tzuhan) 2. 簽發 Token
      const dewt = await signDeWT(identity);

      // Info: (20251203 - Tzuhan) 3. 更新 Session
      await prisma.devicePairingSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', identityId: identity.id },
      });

      // Info: (20251203 - Tzuhan) 4. 推送通知
      const channelName = `private-login-session-${sessionId}`;
      await pusherServer.trigger(channelName, 'device-added-success', { dewt });

      return jsonOk({ message: 'Device added and notified.' });
    }

    if (session.status !== 'PENDING') {
      throw new AppError(ApiCode.NOT_FOUND, 'Session not in PENDING state.');
    }

    await prisma.devicePairingSession.update({
      where: { id: sessionId },
      data: {
        status: 'AUTHORIZED',
        identityId: identity.id,
        challenge: challenge,
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
