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
    // Info: (20251202 - Tzuhan) 注意：狀態必須是 AUTHORIZED (表示 Device A 已經掃碼並同意進行流程)
    const session = await webAuthnRepo.findPairingSessionById(sessionId);
    if (!session || session.status !== 'AUTHORIZED' || !session.challenge || !session.identityId) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Session is not valid for registration.');
    }

    // Info: (20251202 - Tzuhan) 2. 驗證 FIDO2 註冊資料 (確保 Passkey 合法)
    // Info: (20251202 - Tzuhan) 證明 Device B 真的產生了有效的 Passkey
    const registrationInfo = await verifyRegistration(fido2Registration, session.challenge);

    //  Info: (20251202 - Tzuhan) [PoC 4 分歧點]
    // 舊流程：直接寫入 Authenticator 表 -> 完成
    // 新流程：暫存公鑰 -> 通知 Device A 發送 UserOp -> 等待鏈上結果
    if (candidatePublicKey) {
      // Info: (20251202 - Tzuhan) === 新流程 (SCW Add Signer) ===

      // Info: (20251202 - Tzuhan) 3. 將公鑰與憑證 ID 暫存到 Session
      // Info: (20251202 - Tzuhan) 這些資料稍後 Device A 會讀取，用來打包 UserOp
      const candidateData = {
        credentialID: registrationInfo.credential.id,
        credentialPublicKey: registrationInfo.credential.publicKey, // Raw Base64
        counter: registrationInfo.authenticator.counter,
        algorithm: registrationInfo.credential.algorithm,
        userHandle: registrationInfo.user.id,
        // Info: (20251202 - Tzuhan) 關鍵：前端解析好的 X, Y (BigInt string)
        pubKeyX: candidatePublicKey.x,
        pubKeyY: candidatePublicKey.y,
      };

      await webAuthnRepo.updateSessionCandidateData(sessionId, candidateData);

      // Info: (20251202 - Tzuhan) 4. 透過 Pusher 通知 Device A：「新裝置已準備好，請簽名上鏈」
      const channelName = `private-login-session-${sessionId}`;
      await pusherServer.trigger(channelName, 'client-candidate-ready', {
        // Info: (20251202 - Tzuhan) 把需要的 X, Y 傳給 A
        pubKeyX: candidatePublicKey.x,
        pubKeyY: candidatePublicKey.y,
        deviceName: 'New Device', // Info: (20251202 - Tzuhan) 這裡可以讓前端傳入裝置名稱
      });

      return jsonOk({
        message: 'Candidate key stored. Waiting for on-chain authorization.',
        status: 'WAITING_ON_CHAIN',
      });
    } else {
      // Info: (20251202 - Tzuhan) === 舊流程 (如果沒有傳 candidatePublicKey，維持原樣以相容舊代碼) ===

      await webAuthnRepo.addAuthenticatorToIdentity(session.identityId, {
        credentialID: registrationInfo.credential.id,
        credentialPublicKey: registrationInfo.credential.publicKey,
        counter: registrationInfo.authenticator.counter,
        algorithm: registrationInfo.credential.algorithm,
        userHandle: registrationInfo.user.id,
      });

      await webAuthnRepo.updatePairingSessionStatus(sessionId, 'COMPLETED', session.identityId);

      const channelName = `private-login-session-${sessionId}`;
      await pusherServer.trigger(channelName, 'device-added-success', {});

      // Info: (20251202 - Tzuhan) 這裡需要回傳 token 讓 B 登入，但舊流程暫不變動
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
