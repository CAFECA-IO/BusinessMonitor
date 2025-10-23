import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { loggerFromRequest } from '@/lib/logger';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { AppError } from '@/lib/error';
import { updateProfileSchema } from '@/validators';

export async function PATCH(req: NextRequest) {
  const log = loggerFromRequest(req);
  try {
    const identityId = req.headers.get('x-identity-id');
    if (!identityId) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Cannot identify user.');
    }

    const body = await req.json();
    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      throw new AppError(ApiCode.VALIDATION_ERROR, parseResult.error.message);
    }
    const dataToUpdate = parseResult.data;

    if (Object.keys(dataToUpdate).length === 0) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'No fields provided for update.');
    }

    log.info('Updating user profile', { identityId, data: dataToUpdate });

    const updatedUser = await webAuthnRepo.updateIdentityAccount(identityId, dataToUpdate);

    log.info('User profile updated successfully', { identityId });

    // Info: (20251023 - Tzuhan) 回傳更新後的使用者資料 (移除敏感資訊)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedPrivateKey, backupKeyHash, ...safeUserData } = updatedUser;
    return jsonOk(safeUserData);
  } catch (err) {
    log.error('Update profile failed', {
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      code: err instanceof AppError ? err.code : ApiCode.SERVER_ERROR,
    });
    if (err instanceof AppError) {
      return jsonFail(err.code, err.message);
    }
    return jsonFail(
      ApiCode.SERVER_ERROR,
      err instanceof Error ? err.message : 'Unexpected server error'
    );
  }
}

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
      throw new AppError(ApiCode.UNAUTHORIZED, 'Cannot identify user.');
    }

    log.info('Fetching user data for identity', { identityId });

    const identityAccount = await webAuthnRepo.findIdentityAccountById(identityId);

    if (!identityAccount) {
      throw new AppError(ApiCode.NOT_FOUND, `User with ID ${identityId} not found.`);
    }

    // Info: (20251021 - Tzuhan) : 「更新」直接回傳从 repo 獲取的完整 identityAccount 物件
    // 這樣可以確保所有欄位都被包含，且型別與 Prisma Client 一致
    return jsonOk(identityAccount);
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
