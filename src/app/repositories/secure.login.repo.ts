import { prisma } from '@/lib/prisma';
import type { User, Prisma } from '@prisma/client';
import type { RegistrationInfo } from '@passwordless-id/webauthn/dist/esm/types';
import { createHash } from 'crypto';

export type CredentialWithUser = Prisma.CredentialGetPayload<{
  include: { user: true };
}>;

/**
 * Info: (20250912 - Tzuhan)
 * 根據 FIDO2 credentialId 查找憑證及其關聯的使用者。
 * @param credentialId - FIDO2 憑證的唯一 ID
 * @returns - 回傳包含使用者資訊的憑證物件，或 null
 */
export async function findCredentialWithUser(
  credentialId: string
): Promise<CredentialWithUser | null> {
  return prisma.credential.findUnique({
    where: { credentialId },
    include: { user: true },
  });
}

/**
 * Info: (20250912 - Tzuhan)
 * 在資料庫中建立一個新的 User 和與之關聯的 Credential。
 * 這是一個交易操作，確保使用者和憑證同時被建立。
 * @param registrationInfo - 從 server.verifyRegistration 驗證成功後的回傳結果
 * @returns - 回傳新建立的使用者物件
 */
export async function createFidoUserAndCredential(
  registrationInfo: RegistrationInfo
): Promise<User> {
  const { credential } = registrationInfo;
  const { id: credentialId, publicKey, algorithm, transports } = credential;

  const userId = `fido-${createHash('sha256').update(publicKey).digest('hex').slice(0, 24)}`;
  const userEmail = `${userId}@fido.user`; // Info: (20250912 - Tzuhan) 產生一個虛擬 email 以符合 User model

  return prisma.user.create({
    data: {
      id: userId,
      email: userEmail,
      credentials: {
        create: {
          credentialId,
          publicKey,
          algorithm,
          transports: transports.join(','),
        },
      },
    },
  });
}

/** Info: (20250912 - Tzuhan)
 * 將 NamedAlgo 字串轉換為 COSE 演算法的整數 ID 以便存入資料庫。
 */
function mapAlgoNameToInt(algName: 'ES256' | 'RS256' | 'EdDSA'): number {
  switch (algName) {
    case 'ES256':
      return -7;
    case 'RS256':
      return -257;
    case 'EdDSA':
      return -8;
    default:
      throw new Error(`Unsupported algorithm name: ${algName}`);
  }
}
