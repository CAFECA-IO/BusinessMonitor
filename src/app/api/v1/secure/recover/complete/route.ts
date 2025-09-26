import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { webAuthnService } from '@/services/webauthn.services';
import { jsonFail, jsonOk } from '@/lib/response';
import { AppError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { ApiCode } from '@/lib/status';

export async function POST(request: NextRequest) {
  try {
    const fido2Response = await request.json();
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get('webauthn-recovery-session');
    if (!sessionCookie?.value) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'Recovery session expired. Please try again.');
    }

    const { challenge, recovery } = JSON.parse(sessionCookie.value);
    if (!challenge || !recovery?.identityId || !recovery?.userHandle) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'Invalid session data.');
    }

    const result = await webAuthnService.completeRecovery(
      fido2Response,
      challenge,
      recovery.identityId,
      recovery.userHandle
    );

    // Info: (20250926 - Tzuhan) 成功後銷毀 session
    cookieStore.delete('webauthn-recovery-session');

    return jsonOk(result);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Recovery completion failed', { code: error.code, message: error.message });
      return jsonFail(error.code, error.message);
    }

    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    logger.error('Recovery Complete API Error', { errorMessage: message });
    return jsonFail(ApiCode.SERVER_ERROR, message);
  }
}
