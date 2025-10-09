import { NextRequest } from 'next/server';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { AppError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { generateRegistrationOptions } from '@/lib/fido2-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  try {
    if (!sessionId) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'sessionId is required.');
    }

    // Info: (20251009 - Tzuhan) 1. 查找 session 並確認其狀態為「已授權」
    const session = await webAuthnRepo.findPairingSessionById(sessionId);
    if (!session || session.status !== 'AUTHORIZED' || !session.identityId || !session.challenge) {
      throw new AppError(ApiCode.FORBIDDEN, 'Session is not authorized or has expired.');
    }

    // Info: (20251009 - Tzuhan) 2. 獲取授權此 session 的使用者資訊
    const identity = await webAuthnRepo.findIdentityAccountById(session.identityId);
    if (!identity) {
      throw new AppError(ApiCode.NOT_FOUND, 'Associated user account not found.');
    }

    // Info: (20251009 - Tzuhan) 3. 產生註冊選項
    // Info: (20251009 - Tzuhan) 注意：userHandle 必須是唯一的，但 name/displayName 可以是使用者已有的名稱
    const options = generateRegistrationOptions({
      name: identity.name || `New Device`,
      userHandle: session.challenge, // 重用 challenge 作為一次性的 userHandle
    });

    // Info: (20251009 - Tzuhan) 將 challenge 存回 session，以便 complete-setup 時驗證
    await webAuthnRepo.updatePairingSessionStatus(sessionId, 'COMPLETED', session.identityId);

    return jsonOk(options);
  } catch (error) {
    const isAppError = error instanceof AppError;
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    logger.error('Get Setup Options Error', { errorMessage: message });
    return jsonFail(isAppError ? (error as AppError).code : ApiCode.SERVER_ERROR, message);
  }
}
