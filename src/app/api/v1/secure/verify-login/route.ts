import { NextRequest } from 'next/server';
import { getPusherInstance } from '@/lib/pusher';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { verifyAuthentication } from '@/lib/fido2-server';
import { AppError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { signDeWT } from '@/lib/dewt';
import type { AuthenticationJSON } from '@passwordless-id/webauthn/dist/esm/types';

export async function POST(request: NextRequest) {
  const pusherServer = getPusherInstance();
  let sessionId = '';
  try {
    const {
      sessionId: reqSessionId,
      fido2Assertion,
    }: { sessionId: string; fido2Assertion: AuthenticationJSON } = await request.json();

    sessionId = reqSessionId;

    if (!sessionId || !fido2Assertion) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'sessionId and fido2Assertion are required.');
    }

    // Info: (20251001-tzuhan) 1. 查找會話並驗證
    const session = await webAuthnRepo.findPairingSessionById(sessionId);
    if (!session || session.status !== 'PENDING' || new Date() > session.expiresAt) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Session not found, expired, or already used.');
    }

    if (!session.challenge) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'Session is missing a valid challenge.');
    }

    // Info: (20251001-tzuhan) 2. 根據 credentialID 查找 authenticator
    const authenticator = await webAuthnRepo.findAuthenticatorByCredentialId(fido2Assertion.id);
    if (!authenticator) {
      throw new AppError(ApiCode.NOT_FOUND, 'Authenticator not recognized.');
    }

    // Info: (20251001-tzuhan) 3. 驗證 FIDO2 登入
    const verificationResult = await verifyAuthentication(
      fido2Assertion,
      authenticator,
      session.challenge
    );

    if (!verificationResult.userVerified) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'FIDO2 authentication failed.');
    }

    // Info: (20251001-tzuhan) 4. 更新計數器
    await webAuthnRepo.updateAuthenticatorCounter(authenticator.id, verificationResult.counter);

    // Info: (20251001-tzuhan) 5. 簽發 DeWT
    const identityAccount = await webAuthnRepo.findIdentityAccountById(
      authenticator.identityAccountId
    );
    if (!identityAccount) {
      throw new AppError(
        ApiCode.NOT_FOUND,
        'Identity account not found after successful verification.'
      );
    }
    const dewt = await signDeWT(identityAccount);

    // Info: (20251001-tzuhan) 6. 透過 Pusher 發送成功事件
    const channelName = `private-login-session-${sessionId}`;
    await pusherServer.trigger(channelName, 'login-success', { dewt });

    // Info: (20251001-tzuhan) 7. 更新 session 狀態
    await webAuthnRepo.updatePairingSessionStatus(
      sessionId,
      'COMPLETED',
      authenticator.identityAccountId
    );

    return jsonOk({ message: 'Login authorized and notification sent.' });
  } catch (error) {
    const isAppError = error instanceof AppError;
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    logger.error('Verify QR Login Error', {
      sessionId,
      errorMessage: message,
      isAppError,
      code: isAppError ? (error as AppError).code : 'SERVER_ERROR',
    });

    // Info: (20251001-tzuhan) 如果錯誤發生在 Pusher，也通知前端
    if (sessionId) {
      try {
        await pusherServer.trigger(`private-login-session-${sessionId}`, 'login-error', {
          message: 'Failed to complete login on the server.',
        });
      } catch (pusherError) {
        logger.error('Failed to send login-error event via Pusher', {
          pusherError: JSON.stringify(pusherError ?? {}),
        });
      }
    }

    return jsonFail(isAppError ? (error as AppError).code : ApiCode.SERVER_ERROR, message);
  }
}
