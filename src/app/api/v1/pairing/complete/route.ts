import { NextRequest } from 'next/server';
import { getPusherInstance } from '@/lib/pusher';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { verifyRegistration } from '@/lib/fido2-server';
import { AppError } from '@/lib/error';
import { logger } from '@/lib/logger';
import type { RegistrationJSON } from '@passwordless-id/webauthn/dist/esm/types';

// Info: (20251202 - Tzuhan) 定義前端傳來的額外資料 (公鑰)
interface IPairingCompleteBody {
  sessionId: string;
  fido2Registration: RegistrationJSON;
  // Info: (20251202 - Tzuhan) 前端解析好的 P-256 座標 (因為後端解析 COSE 比較麻煩，PoC 階段先信賴前端)
  candidatePublicKey?: {
    x: string;
    y: string;
    label: string;
  };
}

export async function POST(request: NextRequest) {
  const pusherServer = getPusherInstance();
  let sessionId = '';

  try {
    const body = (await request.json()) as IPairingCompleteBody;
    sessionId = body.sessionId;
    const { fido2Registration, candidatePublicKey } = body;

    if (!sessionId || !fido2Registration) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'sessionId and fido2Registration are required.');
    }

    // Info: (20251202 - Tzuhan) 1. 查找 session
    const session = await webAuthnRepo.findPairingSessionById(sessionId);

    if (!session) {
      throw new AppError(ApiCode.NOT_FOUND, 'Session not found.');
    }

    // Info: (20251202 - Tzuhan) 權限檢查邏輯分流
    if (candidatePublicKey) {
      // Info: (20251202 - Tzuhan) === 情境 A：新增裝置 (Device B 傳送公鑰) ===
      // Info: (20251202 - Tzuhan) 允許 PENDING 狀態，且此時 identityId 可能為 null (因為還沒綁定)
      if (session.status !== 'PENDING') {
        throw new AppError(ApiCode.UNAUTHORIZED, 'Session is not in PENDING state.');
      }
    } else {
      // Info: (20251202 - Tzuhan) === 情境 B：舊有流程 ===
      // Info: (20251202 - Tzuhan) 嚴格檢查 AUTHORIZED 和 identityId
      if (session.status !== 'AUTHORIZED' || !session.identityId) {
        throw new AppError(ApiCode.UNAUTHORIZED, 'Session is not authorized for registration.');
      }
    }

    // Info: (20251202 - Tzuhan) 2. 驗證 FIDO2 註冊資料
    const registrationInfo = await verifyRegistration(fido2Registration, session.challenge);

    if (candidatePublicKey) {
      // Info: (20251202 - Tzuhan) 3. [PoC 4] 暫存公鑰並通知 Device A
      const candidateData = {
        credentialID: registrationInfo.credential.id,
        credentialPublicKey: registrationInfo.credential.publicKey,
        counter: registrationInfo.authenticator.counter,
        algorithm: registrationInfo.credential.algorithm,
        userHandle: registrationInfo.user.id,
        pubKeyX: candidatePublicKey.x,
        pubKeyY: candidatePublicKey.y,
        label: candidatePublicKey.label,
      };

      await webAuthnRepo.updateSessionCandidateData(sessionId, candidateData);

      // Info: (20251202 - Tzuhan) 4. 透過 Pusher 通知 Device A
      const channelName = `private-login-session-${sessionId}`;
      await pusherServer.trigger(channelName, 'client-candidate-ready', {
        pubKeyX: candidatePublicKey.x,
        pubKeyY: candidatePublicKey.y,
        label: candidatePublicKey.label,
      });

      return jsonOk({
        message: 'Candidate key stored. Waiting for on-chain authorization.',
        status: 'WAITING_ON_CHAIN',
      });
    } else {
      // Info: (20251202 - Tzuhan)舊流程 (Legacy)
      await webAuthnRepo.addAuthenticatorToIdentity(session.identityId!, {
        credentialID: registrationInfo.credential.id,
        credentialPublicKey: registrationInfo.credential.publicKey,
        counter: registrationInfo.authenticator.counter,
        algorithm: registrationInfo.credential.algorithm,
        userHandle: registrationInfo.user.id,
      });

      await webAuthnRepo.updatePairingSessionStatus(sessionId, 'COMPLETED', session.identityId!);

      const channelName = `private-login-session-${sessionId}`;
      await pusherServer.trigger(channelName, 'device-added-success', {});

      return jsonOk({ message: 'Device added successfully (Legacy).', payload: {} });
    }
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
