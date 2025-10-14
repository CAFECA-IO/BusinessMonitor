import { NextRequest } from 'next/server';
import { getPusherInstance } from '@/lib/pusher';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { verifyRegistration } from '@/lib/fido2-server';
import { AppError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { signDeWT } from '@/lib/dewt';
import type { RegistrationJSON } from '@passwordless-id/webauthn/dist/esm/types';

export async function POST(request: NextRequest) {
  const pusherServer = getPusherInstance();
  let sessionId = '';

  try {
    const {
      sessionId: reqSessionId,
      fido2Registration,
    }: { sessionId: string; fido2Registration: RegistrationJSON } = await request.json();
    sessionId = reqSessionId;

    if (!sessionId || !fido2Registration) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'sessionId and fido2Registration are required.');
    }

    // Info: (20251013 - Tzuhan) 1. 查找 session 並確認其狀態為 AUTHORIZED
    const session = await webAuthnRepo.findPairingSessionById(sessionId);
    if (!session || session.status !== 'AUTHORIZED' || !session.challenge || !session.identityId) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Session is not valid for registration.');
    }

    // Info: (20251013 - Tzuhan) 2. 使用 session 中儲存的 challenge 驗證 FIDO2 註冊資料
    const registrationInfo = await verifyRegistration(fido2Registration, session.challenge);

    // Info: (20251013 - Tzuhan) 3. 使用 webAuthnRepo 將新裝置存入資料庫
    await webAuthnRepo.addAuthenticatorToIdentity(session.identityId, {
      credentialID: registrationInfo.credential.id,
      credentialPublicKey: registrationInfo.credential.publicKey,
      counter: registrationInfo.authenticator.counter,
      algorithm: registrationInfo.credential.algorithm,
      userHandle: registrationInfo.user.id,
    });

    // Info: (20251013 - Tzuhan) 4. 使用 webAuthnRepo 將 session 狀態更新為 COMPLETED
    await webAuthnRepo.updatePairingSessionStatus(sessionId, 'COMPLETED', session.identityId);

    // Info: (20251013 - Tzuhan) 5. 為新裝置簽發一個 DeWT，讓它可以直接登入
    const identityAccount = await webAuthnRepo.findIdentityAccountById(session.identityId);
    if (!identityAccount) throw new AppError(ApiCode.NOT_FOUND, 'Identity account not found.');
    const dewt = await signDeWT(identityAccount);

    // Info: (20251013 - Tzuhan) 6. 透過 Pusher 通知舊裝置，新增成功
    const channelName = `private-login-session-${sessionId}`;
    await pusherServer.trigger(channelName, 'device-added-success', {});

    // Info: (20251013 - Tzuhan) 7. 將 DeWT 回傳給新裝置
    return jsonOk({ message: 'Device added successfully.', payload: { dewt } });
  } catch (error) {
    const isAppError = error instanceof AppError;
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    logger.error('Pairing Complete Error', { sessionId, errorMessage: message });

    if (sessionId) {
      const channelName = `private-login-session-${sessionId}`;
      await pusherServer.trigger(channelName, 'device-added-error', {
        message: 'Failed to complete device pairing on the server.',
      });
    }

    return jsonFail(isAppError ? (error as AppError).code : ApiCode.SERVER_ERROR, message);
  }
}
