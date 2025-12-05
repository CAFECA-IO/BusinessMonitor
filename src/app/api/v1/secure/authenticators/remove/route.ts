import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { loggerFromRequest } from '@/lib/logger';
import { bundlerService } from '@/services/bundler.service';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { AppError } from '@/lib/error';

export async function POST(req: NextRequest) {
  const log = loggerFromRequest(req);
  try {
    const identityId = req.headers.get('x-identity-id');
    if (!identityId) {
      throw new AppError(ApiCode.UNAUTHORIZED, 'Unauthorized');
    }

    const { userOp, entryPointAddress, authenticatorId } = await req.json();

    if (!userOp || !entryPointAddress || !authenticatorId) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'Missing required fields');
    }

    // Info: (20251204 - Tzuhan) 1. 驗證裝置歸屬權 (確保用戶只能刪除自己的裝置)
    const authenticator = await webAuthnRepo.findAuthenticatorById(authenticatorId);
    if (!authenticator || authenticator.identityAccountId !== identityId) {
      throw new AppError(ApiCode.FORBIDDEN, 'Authenticator not found or access denied');
    }

    // Info: (20251204 - Tzuhan) 2. 發送 UserOp 到區塊鏈 (移除 Signer)
    log.info(`[Remove Device] Sending UserOp to remove signer: ${authenticatorId}`);
    const bundlerResult = await bundlerService.sendUserOp(userOp, entryPointAddress);

    if (bundlerResult.status !== 'success') {
      throw new AppError(ApiCode.SERVER_ERROR, 'Blockchain transaction failed');
    }

    // Info: (20251204 - Tzuhan) 3. 區塊鏈成功後，刪除資料庫紀錄
    log.info(`[Remove Device] Blockchain success, deleting from DB: ${authenticatorId}`);
    await webAuthnRepo.deleteAuthenticator(authenticatorId);

    return jsonOk({
      message: 'Device removed successfully from chain and database',
      transactionHash: bundlerResult.transactionHash,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error(`[Remove Device] Failed: ${message}`);

    if (err instanceof AppError) return jsonFail(err.code, err.message);
    return jsonFail(ApiCode.SERVER_ERROR, message);
  }
}
