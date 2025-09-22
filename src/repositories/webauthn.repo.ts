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

export interface IWebAuthnRepository {
  findAuthenticatorByCredentialId(credentialID: string): Promise<Authenticator | null>;
  findIdentityAccountById(id: string): Promise<IdentityAccount | null>;
  updateAuthenticatorCounter(id: string, newCounter: number): Promise<void>;
  createIdentityAndAuthenticator(data: ICreateIdentityData): Promise<IdentityAccount>;
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
}

export const webAuthnRepo = new WebAuthnRepository();
