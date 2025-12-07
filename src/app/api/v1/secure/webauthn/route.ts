import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { webAuthnService } from '@/services/webauthn.services';
import { jsonFail, jsonOk } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { AppError } from '@/lib/error';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();

    // Info: (20251128 - Tzuhan) 支援新的 Payload 格式: { action, credential, scwData }
    // 同時相容舊格式 (直接傳送 credential object)
    const fido2Response = body.credential || body;
    const { authenticatorLabel, scwData } = body; // Info: (20251128 - Tzuhan) 可選的 SCW 資料

    const sessionCookie = cookieStore.get('webauthn-session');
    if (!sessionCookie?.value) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'Session expired. Please try again.');
    }

    const { challenge } = JSON.parse(sessionCookie.value);
    if (!challenge) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'Invalid session: challenge missing.');
    }

    // Info: (20251128 - Tzuhan) 將 scwData 傳遞給 Service
    const result = await webAuthnService.loginOrRegister(
      fido2Response,
      challenge,
      authenticatorLabel,
      scwData
    );

    cookieStore.delete('webauthn-session');

    return jsonOk(result);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('WebAuthn verification failed', { code: error.code, message: error.message });
      return jsonFail(error.code, error.message);
    }

    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    logger.error('WebAuthn API Error', {
      errorMessage: message,
      stack: (error as Error).stack ?? '',
    });
    return jsonFail(ApiCode.SERVER_ERROR, 'An unexpected server error occurred.');
  }
}
