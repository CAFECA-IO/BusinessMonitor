import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { logger } from '@/lib/logger';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { generateChallenge } from '@/lib/fido2-server';
import { AppError } from '@/lib/error';

export async function POST() {
  try {
    const challenge = generateChallenge();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 設置 3 分鐘後過期

    const session = await webAuthnRepo.createPairingSession({
      challenge,
      expiresAt,
    });

    return jsonOk({
      sessionId: session.id,
      challenge: session.challenge,
    });
  } catch (error) {
    const isAppError = error instanceof AppError;
    logger.error('Failed to initiate pairing session', {
      code: isAppError ? error.code : 'UNKNOWN',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return jsonFail(
      isAppError ? error.code : ApiCode.SERVER_ERROR,
      error instanceof Error ? error.message : 'An unknown server error occurred'
    );
  }
}
