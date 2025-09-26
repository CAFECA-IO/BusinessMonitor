import { prisma } from '@/lib/prisma';
import { WebAuthnAlgo, type IdentityAccount, type Authenticator } from '@prisma/client';

export interface ICreateIdentityData {
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

// Info: (20250926 - Tzuhan) 【新增】定義新增 Authenticator 所需的資料結構
export interface IAddAuthenticatorData {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  algorithm: WebAuthnAlgo;
  userHandle: string;
}

export interface IWebAuthnRepository {
  findAuthenticatorByCredentialId(credentialID: string): Promise<Authenticator | null>;
  findIdentityAccountById(id: string): Promise<IdentityAccount | null>;
  updateAuthenticatorCounter(id: string, newCounter: number): Promise<void>;
  createIdentityAndAuthenticator(data: ICreateIdentityData): Promise<IdentityAccount>;
  // Info: (20250926 - Tzuhan) 【新增】透過備份碼雜湊值尋找身份帳戶
  findIdentityByBackupKeyHash(backupKeyHash: string): Promise<IdentityAccount | null>;
  // Info: (20250926 - Tzuhan) 【新增】將一個新的 Authenticator (裝置) 關聯到現有的身份帳戶
  addAuthenticatorToIdentity(
    identityAccountId: string,
    data: IAddAuthenticatorData
  ): Promise<Authenticator>;
}

class WebAuthnRepository implements IWebAuthnRepository {
  public async findAuthenticatorByCredentialId(
    credentialID: string
  ): Promise<Authenticator | null> {
    return prisma.authenticator.findUnique({ where: { credentialID } });
  }

  public async findIdentityAccountById(id: string): Promise<IdentityAccount | null> {
    return prisma.identityAccount.findUnique({
      where: { id },
      select: {
        id: true,
        ethereumAddress: true,
        name: true,
        email: true,
        photo: true,
        encryptedPrivateKey: true,
        backupKeyHash: true,
      },
    });
  }

  public async updateAuthenticatorCounter(id: string, newCounter: number): Promise<void> {
    await prisma.authenticator.update({
      where: { id },
      data: { counter: BigInt(newCounter) },
    });
  }

  public async createIdentityAndAuthenticator(data: ICreateIdentityData): Promise<IdentityAccount> {
    return prisma.identityAccount.create({
      data: {
        name: data.name,
        ethereumAddress: data.ethereumAddress,
        encryptedPrivateKey: data.encryptedPrivateKey,
        backupKeyHash: data.backupKeyHash,
        authenticators: { create: { ...data.credential } },
      },
      select: {
        id: true,
        ethereumAddress: true,
        name: true,
        email: true,
        photo: true,
        encryptedPrivateKey: true,
        backupKeyHash: true,
      },
    });
  }

  // Info: (20250926 - Tzuhan) 【新增】透過備份碼雜湊值尋找身份帳戶
  public async findIdentityByBackupKeyHash(backupKeyHash: string): Promise<IdentityAccount | null> {
    // Info: (20250926 - Tzuhan) backupKeyHash 在 prisma schema 中應被設為 @unique
    return prisma.identityAccount.findUnique({
      where: { backupKeyHash },
      select: {
        id: true,
        ethereumAddress: true,
        name: true,
        email: true,
        photo: true,
        encryptedPrivateKey: true,
        backupKeyHash: true,
      },
    });
  }

  // Info: (20250926 - Tzuhan) 【新增】將一個新的 Authenticator (裝置) 關聯到現有的身份帳戶
  public async addAuthenticatorToIdentity(
    identityAccountId: string,
    data: IAddAuthenticatorData
  ): Promise<Authenticator> {
    return prisma.authenticator.create({
      data: {
        ...data,
        // Info: (20250926 - Tzuhan) 透過 connect 將此新紀錄關聯到指定的 IdentityAccount
        identityAccount: {
          connect: {
            id: identityAccountId,
          },
        },
      },
    });
  }
}

export const webAuthnRepo = new WebAuthnRepository();
