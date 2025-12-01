import { prisma } from '@/lib/prisma';
import {
  WebAuthnAlgo,
  type IdentityAccount,
  type Authenticator,
  type DevicePairingSession,
  Prisma,
} from '@prisma/client';

// Info: (20251128 - Tzuhan) 更新介面，加入 SCW 相關欄位
export interface ICreateIdentityData {
  name: string;
  blockchainAddress?: string;
  initPublicKey?: Prisma.InputJsonValue; // Info: (20251128 - Tzuhan) 對應 Json 類型
  deploymentSalt?: string;

  credential: {
    credentialID: string;
    credentialPublicKey: string;
    counter: number;
    algorithm: WebAuthnAlgo;
    userHandle: string;
  };
}

export interface IUpdateIdentityData {
  name?: string;
  photo?: string;
  email?: string;
  blockchainAddress?: string;
  initPublicKey?: Prisma.InputJsonValue;
  deploymentSalt?: string;
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
  addAuthenticatorToIdentity(
    identityAccountId: string,
    data: IAddAuthenticatorData
  ): Promise<Authenticator>;
  findPairingSessionById(id: string): Promise<DevicePairingSession | null>;
  createPairingSession(data: { challenge: string; expiresAt: Date }): Promise<DevicePairingSession>;
  updatePairingSessionStatus(
    id: string,
    status: 'COMPLETED' | 'AUTHORIZED',
    identityId: string
  ): Promise<DevicePairingSession>;
  updateSessionCandidateData(
    sessionId: string,
    candidateData: Prisma.InputJsonValue
  ): Promise<void>;
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
    return prisma.identityAccount.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        // encryptedBlockchainKey: true, // Deprecated
        // blockchainPublicKey: true, // Deprecated
        blockchainAddress: true,
        initPublicKey: true,
        deploymentSalt: true,
        derivationNonce: true,
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
        // Info: (20251128 - Tzuhan) 寫入 SCW 相關資訊
        blockchainAddress: data.blockchainAddress,
        initPublicKey: data.initPublicKey ?? Prisma.DbNull,
        deploymentSalt: data.deploymentSalt,

        authenticators: { create: { ...data.credential } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        // encryptedBlockchainKey: true,
        // blockchainPublicKey: true, // Deprecated
        blockchainAddress: true,
        initPublicKey: true,
        deploymentSalt: true,
        derivationNonce: true,
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

  public async createPairingSession(data: {
    challenge: string;
    expiresAt: Date;
  }): Promise<DevicePairingSession> {
    return prisma.devicePairingSession.create({ data });
  }

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

  public async updateSessionCandidateData(
    sessionId: string,
    candidateData: Prisma.InputJsonValue
  ): Promise<void> {
    await prisma.devicePairingSession.update({
      where: { id: sessionId },
      data: { pendingCandidateData: candidateData },
    });
  }

  public async updateIdentityAccount(
    id: string,
    data: IUpdateIdentityData
  ): Promise<IdentityAccount> {
    return prisma.identityAccount.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.photo !== undefined && { photo: data.photo }),

        // Info: (20251128 - Tzuhan) [PoC 4] 支援更新 SCW 資訊 (用於舊用戶初始化或修復)
        ...(data.blockchainAddress !== undefined && { blockchainAddress: data.blockchainAddress }),
        ...(data.initPublicKey !== undefined && { initPublicKey: data.initPublicKey }),
        ...(data.deploymentSalt !== undefined && { deploymentSalt: data.deploymentSalt }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        // encryptedBlockchainKey: true, // Deprecated
        // blockchainPublicKey: true, // Deprecated
        blockchainAddress: true,
        initPublicKey: true,
        deploymentSalt: true,
        derivationNonce: true,
      },
    });
  }
}

export const webAuthnRepo = new WebAuthnRepository();
