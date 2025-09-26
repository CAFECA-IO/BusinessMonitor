import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { webAuthnService } from '@/services/webauthn.services';
import { jsonFail, jsonOk } from '@/lib/response';
import { AppError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { ApiCode } from '@/lib/status';

export async function POST(request: NextRequest) {
  try {
    const { backupKey } = await request.json();
    const cookieStore = await cookies();

    if (!backupKey) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'Backup key is required.');
    }

    const { options, sessionData } = await webAuthnService.initiateRecovery(backupKey);

    // Info: (20250926 - Tzuhan) 將恢復所需的安全資訊存入 cookie
    cookieStore.set('webauthn-recovery-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
      maxAge: 120, // 2 minutes
    });

    return jsonOk(options);
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Recovery initiation failed', { code: error.code, message: error.message });
      return jsonFail(error.code, error.message);
    }
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    logger.error('Recovery Initiate API Error', { errorMessage: message });
    return jsonFail(ApiCode.SERVER_ERROR, message);
  }
}
