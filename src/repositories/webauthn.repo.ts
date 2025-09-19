import { prisma } from '@/lib/prisma';
// Info: (20250917 - Tzuhan) 直接從 prisma client 導入 Enum，確保類型同步
import { WebAuthnAlgo, type IdentityAccount, type Authenticator } from '@prisma/client';

// Info: (20250917 - Tzuhan) 更新 DTO 的類型定義，使其與 Prisma Enum 同步
export interface CreateIdentityData {
  name: string;
  ethereumAddress: string;
  encryptedPrivateKey: string;
  backupKeyHash: string;
  credential: {
    credentialID: string;
    credentialPublicKey: string;
    counter: number;
    algorithm: WebAuthnAlgo;
    userHandle: string;
  };
}

class WebAuthnRepository {
  public async findAuthenticatorByUserHandle(userHandle: string): Promise<Authenticator | null> {
    return prisma.authenticator.findUnique({
      where: { userHandle },
    });
  }

  public async findAuthenticatorByCredentialId(
    credentialID: string
  ): Promise<Authenticator | null> {
    return prisma.authenticator.findUnique({
      where: { credentialID },
    });
  }

  public async findIdentityAccountById(id: string): Promise<IdentityAccount | null> {
    return prisma.identityAccount.findUnique({
      where: { id },
    });
  }

  // Info: (20250917 - Tzuhan)參數類型從 number 改為 bigint，因為 DB 是 BigInt
  public async updateAuthenticatorCounter(id: string, newCounter: number): Promise<void> {
    await prisma.authenticator.update({
      where: { id },
      data: { counter: BigInt(newCounter) }, // 存入 DB 時轉回 BigInt
    });
  }

  public async createIdentityAndAuthenticator(data: CreateIdentityData): Promise<IdentityAccount> {
    return prisma.identityAccount.create({
      data: {
        name: data.name,
        ethereumAddress: data.ethereumAddress,
        encryptedPrivateKey: data.encryptedPrivateKey,
        backupKeyHash: data.backupKeyHash,
        authenticators: {
          create: {
            credentialID: data.credential.credentialID,
            credentialPublicKey: data.credential.credentialPublicKey,
            counter: data.credential.counter,
            algorithm: data.credential.algorithm,
            userHandle: data.credential.userHandle,
          },
        },
      },
    });
  }
}

export const webAuthnRepo = new WebAuthnRepository();
