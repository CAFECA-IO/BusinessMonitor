import { prisma } from '@/lib/prisma';
import {
  WebAuthnAlgo,
  type IdentityAccount,
  type Authenticator,
  type DevicePairingSession,
} from '@prisma/client';

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
  findIdentityByBackupKeyHash(backupKeyHash: string): Promise<IdentityAccount | null>;
  addAuthenticatorToIdentity(
    identityAccountId: string,
    data: IAddAuthenticatorData
  ): Promise<Authenticator>;
  findPairingSessionById(id: string): Promise<DevicePairingSession | null>;
  // Info: (20251001-tzuhan) 【新增】為 QR Code 登入流程建立一個新的裝置配對會話
  createPairingSession(data: { challenge: string; expiresAt: Date }): Promise<DevicePairingSession>;
  // Info: (20251001-tzuhan) 【新增】在登入成功後更新會話狀態
  updatePairingSessionStatus(
    id: string,
    status: 'COMPLETED' | 'AUTHORIZED',
    identityId: string
  ): Promise<DevicePairingSession>;
}

class WebAuthnRepository implements IWebAuthnRepository {
  public async findAuthenticatorByCredentialId(
    credentialID: string
  ): Promise<Authenticator | null> {
    return prisma.authenticator.findUnique({ where: { credentialID } });
  }

  public async findPairingSessionById(id: string): Promise<DevicePairingSession | null> {
    return prisma.devicePairingSession.findUnique({ where: { id } });
  }

  public async findIdentityAccountById(id: string): Promise<IdentityAccount | null> {
    // Info: (20251001-tzuhan) 確保關聯查詢中包含必要的 dewt 欄位
    return prisma.identityAccount.findUnique({
      where: { id },
      select: {
        id: true,
        ethereumAddress: true,
        name: true,
        email: true,
        photo: true,
        encryptedPrivateKey: true, // Info: (20251001-tzuhan) 簽發 dewt 不需要私鑰
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

  public async findIdentityByBackupKeyHash(backupKeyHash: string): Promise<IdentityAccount | null> {
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

  public async addAuthenticatorToIdentity(
    identityAccountId: string,
    data: IAddAuthenticatorData
  ): Promise<Authenticator> {
    return prisma.authenticator.create({
      data: {
        ...data,
        identityAccount: {
          connect: {
            id: identityAccountId,
          },
        },
      },
    });
  }

  // Info: (20251001-tzuhan) 【新增】建立一個新的裝置配對會話
  public async createPairingSession(data: {
    challenge: string;
    expiresAt: Date;
  }): Promise<DevicePairingSession> {
    return prisma.devicePairingSession.create({ data });
  }

  // Info: (20251001-tzuhan) 【新增】在登入成功後更新會話狀態
  public async updatePairingSessionStatus(
    id: string,
    status: 'COMPLETED' | 'AUTHORIZED',
    identityId: string
  ): Promise<DevicePairingSession> {
    return prisma.devicePairingSession.update({
      where: { id },
      data: { status, identityId },
    });
  }
}

export const webAuthnRepo = new WebAuthnRepository();
