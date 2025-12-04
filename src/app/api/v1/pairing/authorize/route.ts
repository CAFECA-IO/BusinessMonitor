import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { AppError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { getIdentityFromDeWT, signDeWT } from '@/lib/dewt';
import { getPusherInstance } from '@/lib/pusher';
import { verifyAuthentication } from '@/lib/fido2-server';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import type { AuthenticationJSON } from '@passwordless-id/webauthn/dist/esm/types';
import { Authenticator } from '@prisma/client';

// Info: (20251204 - Tzuhan) 定義請求 Payload，支援兩種 Action
type AuthorizePayload =
  | { action: 'confirm_add_device'; sessionId: string }
  | { action: 'authorize_login'; sessionId: string; fido2Assertion: AuthenticationJSON };

export async function POST(request: NextRequest) {
  const pusherServer = getPusherInstance();

  try {
    // Info: (20251204 - Tzuhan) 1. 驗證 Device A (發起者) 的身分
    const identity = await getIdentityFromDeWT(request.headers.get('Authorization'));
    if (!identity) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Invalid or missing token.');
    }

    const body = (await request.json()) as AuthorizePayload;
    const { action, sessionId } = body;

    if (!sessionId) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'sessionId is required.');
    }

    // Info: (20251204 - Tzuhan) 2. 查找 Session
    const session = await prisma.devicePairingSession.findUnique({ where: { id: sessionId } });
    if (!session || session.status === 'COMPLETED' || session.status === 'EXPIRED') {
      throw new AppError(ApiCode.NOT_FOUND, 'Session not found or expired.');
    }

    // Info: (20251204 - Tzuhan) 3. 根據 Action 分流處理
    if (action === 'confirm_add_device') {
      // =================================================================
      // 情境 A: 新增裝置 (鏈上交易已完成，後端同步 DB)
      // =================================================================
      if (!session.pendingCandidateData) {
        throw new AppError(ApiCode.VALIDATION_ERROR, 'No pending device data found.');
      }
      const candidateData = session.pendingCandidateData as unknown as Authenticator;

      logger.info('[Authorize] Confirming Add Device', { sessionId });

      // Info: (20251204 - Tzuhan) 寫入 Authenticator
      await prisma.authenticator.create({
        data: {
          credentialID: candidateData.credentialID,
          credentialPublicKey: candidateData.credentialPublicKey,
          counter: BigInt(candidateData.counter || 0),
          algorithm: candidateData.algorithm,
          userHandle: candidateData.userHandle,
          label: candidateData.label || 'New Device',
          identityAccount: { connect: { id: identity.id } },
        },
      });

      // Info: (20251204 - Tzuhan) 簽發 Token 並完成 Session
      const dewt = await signDeWT(identity);
      await prisma.devicePairingSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', identityId: identity.id },
      });

      // Info: (20251204 - Tzuhan) 通知 Device B
      await pusherServer.trigger(`private-login-session-${sessionId}`, 'device-added-success', {
        dewt,
      });

      return jsonOk({ message: 'Device added successfully.' });
    } else if (action === 'authorize_login') {
      // =================================================================
      // 情境 B: 跨裝置登入 (驗證 FIDO2 簽名)
      // =================================================================
      const { fido2Assertion } = body;
      if (!fido2Assertion) {
        throw new AppError(ApiCode.VALIDATION_ERROR, 'fido2Assertion is required for login.');
      }

      logger.info('[Authorize] Verifying Login', { sessionId });

      // Info: (20251204 - Tzuhan) 驗證 Authenticator 是否存在
      const authenticator = await webAuthnRepo.findAuthenticatorByCredentialId(fido2Assertion.id);
      if (!authenticator || authenticator.identityAccountId !== identity.id) {
        throw new AppError(ApiCode.FORBIDDEN, 'Authenticator does not belong to this user.');
      }

      // Info: (20251204 - Tzuhan) 驗證簽名 (使用 Session Challenge)
      const verificationResult = await verifyAuthentication(
        fido2Assertion,
        authenticator,
        session.challenge
      );

      if (!verificationResult.userVerified) {
        throw new AppError(ApiCode.UNAUTHORIZED, 'FIDO2 authentication failed.');
      }

      await webAuthnRepo.updateAuthenticatorCounter(authenticator.id, verificationResult.counter);

      // Info: (20251204 - Tzuhan) 簽發 Token 並完成 Session
      const dewt = await signDeWT(identity);
      await prisma.devicePairingSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', identityId: identity.id },
      });

      // Info: (20251204 - Tzuhan) 通知 Device B (注意：事件名稱統一為 login-success 以區分)
      await pusherServer.trigger(`private-login-session-${sessionId}`, 'login-success', { dewt });

      return jsonOk({ message: 'Login authorized successfully.' });
    } else {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'Invalid action.');
    }
  } catch (error) {
    const isAppError = error instanceof AppError;
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Authorize] Error', { errorMessage: message });
    return jsonFail(isAppError ? (error as AppError).code : ApiCode.SERVER_ERROR, message);
  }
}
