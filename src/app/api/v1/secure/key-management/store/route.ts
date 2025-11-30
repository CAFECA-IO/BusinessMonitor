// Info: (20251128 - Tzuhan) Deprecated 我們不再需要將 encryptedPrivateKey 存入 DB

// import { NextRequest } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { jsonOk, jsonFail } from '@/lib/response';
// import { ApiCode } from '@/lib/status';
// import { AppError } from '@/lib/error';
// import { logger } from '@/lib/logger';

// // Info: (20251017 - Tzuhan) 此路由預期由 apiMiddleware 保護，它會驗證 DeWT 並注入 'x-identity-id' 標頭
// export async function POST(request: NextRequest) {
//   try {
//     const identityId = request.headers.get('x-identity-id');
//     if (!identityId) {
//       // Info: (20251017 - Tzuhan) 這是個內部錯誤，因為 middleware 應該已經攔截了無效 token 的請求
//       throw new AppError(ApiCode.UNAUTHORIZED, '無法識別使用者身份，請確認請求是否經過授權。');
//     }

//     const { encryptedPrivateKey, publicKey, address, derivationNonce } = await request.json();

//     if (!encryptedPrivateKey || !publicKey || !address || !derivationNonce) {
//       throw new AppError(
//         ApiCode.VALIDATION_ERROR,
//         '請求中缺少必要的金鑰資訊 (encryptedPrivateKey, publicKey, address, derivationNonce)。'
//       );
//     }

//     await prisma.identityAccount.update({
//       where: { id: identityId },
//       data: {
//         encryptedBlockchainKey: encryptedPrivateKey,
//         blockchainPublicKey: publicKey,
//         blockchainAddress: address,
//         derivationNonce: derivationNonce,
//       },
//     });

//     return jsonOk({ message: '區塊鏈金鑰已成功儲存。' });
//   } catch (error) {
//     const isAppError = error instanceof AppError;
//     const message = error instanceof Error ? error.message : '發生未知錯誤。';
//     logger.error('儲存區塊鏈金鑰時發生錯誤 (Store Blockchain Key Error)', {
//       errorMessage: message,
//     });
//     return jsonFail(isAppError ? (error as AppError).code : ApiCode.SERVER_ERROR, message);
//   }
// }
