import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { AppError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { getIdentityFromDeWT, signDeWT } from '@/lib/dewt';
import { getPusherInstance } from '@/lib/pusher';

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
    if (!session || session.status === 'COMPLETED' || session.status === 'EXPIRED') {
      // Info: (20251202 - Tzuhan) 狀態檢查放寬一點，只要不是已完成或過期即可 (因為 Add Device 流程狀態可能是 PENDING)
      throw new AppError(ApiCode.NOT_FOUND, 'Session not valid.');
    }

    if (challenge === 'poc4-authorized' && session.pendingCandidateData) {
      // Info: (20251202 - Tzuhan) 2. 簽發 Token 給新裝置
      const dewt = await signDeWT(identity);

      // Info: (20251202 - Tzuhan) 3. 更新 Session 狀態
      await prisma.devicePairingSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', identityId: identity.id },
      });

      // Info: (20251202 - Tzuhan) 4. [重要] 推送成功事件給 Device B
      const channelName = `private-login-session-${sessionId}`;
      await pusherServer.trigger(channelName, 'device-added-success', { dewt });

      return jsonOk({ message: 'Device added and notified.' });
    }

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
