import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { logger } from '@/lib/logger';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { verifyAuthentication } from '@/lib/fido2-server';
import type { AuthenticationJSON } from '@passwordless-id/webauthn/dist/esm/types';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, fido2Assertion }: { sessionId: string; fido2Assertion: AuthenticationJSON } =
      await request.json();

    if (!sessionId || !fido2Assertion) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'sessionId and fido2Assertion are required.');
    }

    // 1. 從資料庫中查找會話
    const session = await webAuthnRepo.findPairingSessionById(sessionId);
    if (!session || session.status !== 'PENDING') {
      throw new AppError(ApiCode.NOT_FOUND, 'Session not found or already used.');
    }

    if (new Date() > session.expiresAt) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Session has expired.');
    }

    if (!session.challenge) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'Session is missing a valid challenge.');
    }

    // 2. 【關鍵修正】根據您的經驗，改用 credentialID 來查找對應的 authenticator
    const authenticator = await webAuthnRepo.findAuthenticatorByCredentialId(fido2Assertion.id);

    if (!authenticator) {
      throw new AppError(ApiCode.NOT_FOUND, 'Authenticator not found.');
    }

    // 3. 驗證 FIDO2 登入憑證
    const verificationResult = await verifyAuthentication(
      fido2Assertion,
      authenticator,
      session.challenge
    );

    if (!verificationResult.userVerified) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'FIDO2 authentication failed.');
    }

    // 4. 更新資料庫中的計數器
    await webAuthnRepo.updateAuthenticatorCounter(authenticator.id, verificationResult.counter);

    // 5. 透過內部 HTTP 請求通知 WebSocket 伺服器
    const wsNotifyUrl = `http://localhost:${
      process.env.WS_PORT || 3001
    }/api/v1/internal/notify-login`;
    const notifyResponse = await fetch(wsNotifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        identityId: authenticator.identityAccountId,
      }),
    });

    if (!notifyResponse.ok) {
      logger.error('Failed to notify WebSocket server after successful login.', { sessionId });
    }

    // 6. 回應手機端，告知授權成功
    return jsonOk({
      message: 'Login authorized. The desktop client should now be logged in.',
    });
  } catch (error) {
    const isAppError = error instanceof AppError;
    logger.warn('QR Login verification failed', {
      code: isAppError ? error.code : 'UNKNOWN',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return jsonFail(
      isAppError ? error.code : ApiCode.SERVER_ERROR,
      error instanceof Error ? error.message : 'An unknown server error occurred'
    );
  }
}
