import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { loggerFromRequest } from '@/lib/logger';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { AppError } from '@/lib/error';

/**
 * Info: (20250925 - Tzuhan)
 * GET /api/v1/secure/me
 *
 * 一個受保護的 API 端點，用於獲取當前登入用戶的基本資訊。
 * 此路由會先由 `middleware.ts` 進行 DeWT 驗證。
 * 如果驗證成功，middleware 會將用戶 ID 注入到 `x-identity-id` 標頭中。
 */
export async function GET(request: NextRequest) {
  const log = loggerFromRequest({
    method: request.method,
    url: request.nextUrl.pathname,
    requestIdHeader: request.headers.get('x-request-id') || undefined,
  });

  try {
    // Info: (20250925 - Tzuhan) 從 middleware 注入的標頭中獲取用戶 ID
    const identityId = request.headers.get('x-identity-id');

    if (!identityId) {
      log.error('Missing x-identity-id header in /me route. Middleware might be misconfigured.');
      // Info: (20250925 - Tzuhan) 這理論上不應該發生，因為 middleware 應該已經攔截了無效請求
      throw new AppError(ApiCode.UNAUTHENTICATED, 'Cannot identify user.');
    }

    log.info('Fetching user data for identity', { identityId });

    // Info: (20250925 - Tzuhan) 使用您提供的 repository 來查詢用戶資訊
    const identityAccount = await webAuthnRepo.findIdentityAccountById(identityId);

    if (!identityAccount) {
      log.warn('Identity account not found in database for a valid DeWT.', { identityId });
      throw new AppError(ApiCode.NOT_FOUND, `User with ID ${identityId} not found.`);
    }

    // Info: (20250925 - Tzuhan) 只回傳安全的、必要的資訊給前端
    const userProfile = {
      id: identityAccount.id,
      name: identityAccount.name,
      email: identityAccount.email,
      photo: identityAccount.photo,
      ethAddress: identityAccount.ethereumAddress,
      isAuthenticated: true, // Info: (20250925 - Tzuhan) 明確標示為已登入
    };

    return jsonOk(userProfile);
  } catch (error) {
    if (error instanceof AppError) {
      log.warn('Handled application error in /me route', {
        code: error.code,
        message: error.message,
      });
      return jsonFail(error.code, error.message);
    }

    log.error('Unhandled exception in /me route', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: (error as Error).stack ?? '',
    });
    return jsonFail(
      ApiCode.SERVER_ERROR,
      'An unexpected error occurred while fetching user profile.'
    );
  }
}
