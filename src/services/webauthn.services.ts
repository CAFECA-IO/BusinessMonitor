import type {
  RegistrationJSON,
  AuthenticationJSON,
} from '@passwordless-id/webauthn/dist/esm/types';
import {
  generateRegistrationOptions,
  verifyAuthentication,
  verifyRegistration,
} from '@/lib/fido2-server';
import { signDeWT } from '@/lib/dewt';
import { generateEthereumKeyPair, encryptPrivateKey } from '@/lib/eth-keys';
import { generateBackupKey, hashBackupKey } from '@/lib/backup-key';
import type {
  IWebAuthnRepository,
  ICreateIdentityData,
  IAddAuthenticatorData,
} from '@/repositories/webauthn.repo';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { WebAuthnAlgo } from '@prisma/client';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { randomUUID } from 'node:crypto';

const ERROR_MESSAGES = {
  USER_HANDLE_MISSING: 'User handle not found in FIDO2 registration response.',
  CREDENTIAL_ID_MISSING: 'Credential ID missing from authenticator response.',
  AUTHENTICATOR_NOT_FOUND: 'Authenticator not found. This device may not be registered.',
  IDENTITY_NOT_FOUND: 'Identity account not found for existing authenticator.',
  INVALID_BACKUP_KEY: 'Invalid backup key provided.',
  RECOVERY_SESSION_INVALID: 'Invalid recovery session. Please try again.',
};

function isRegistrationJSON(
  response: RegistrationJSON | AuthenticationJSON
): response is RegistrationJSON {
  return 'attestationObject' in response.response;
}

interface ILoginResult {
  dewt: string;
  backupKey?: string;
}

class WebAuthnService {
  constructor(private readonly repo: IWebAuthnRepository) {}

  public async loginOrRegister(
    fido2Response: RegistrationJSON | AuthenticationJSON,
    expectedChallenge: string
  ): Promise<ILoginResult> {
    if (isRegistrationJSON(fido2Response)) {
      return this.handleRegistration(fido2Response, expectedChallenge);
    }
    return this.handleAuthentication(fido2Response, expectedChallenge);
  }

  private async handleRegistration(
    registrationData: RegistrationJSON,
    expectedChallenge: string
  ): Promise<ILoginResult> {
    const verification = await verifyRegistration(registrationData, expectedChallenge);
    const { id: credentialID, publicKey: credentialPublicKey, algorithm } = verification.credential;
    const { id: userHandle } = registrationData.user;

    if (!userHandle)
      throw new AppError(ApiCode.VALIDATION_ERROR, ERROR_MESSAGES.USER_HANDLE_MISSING);

    const ethKeyPair = generateEthereumKeyPair();
    const backupKey = generateBackupKey();

    const creationData: ICreateIdentityData = {
      name: `User ${userHandle.substring(0, 6)}`,
      ethereumAddress: ethKeyPair.address,
      encryptedPrivateKey: encryptPrivateKey(ethKeyPair.privateKey),
      backupKeyHash: await hashBackupKey(backupKey),
      credential: {
        credentialID,
        credentialPublicKey,
        counter: verification.authenticator.counter,
        algorithm: WebAuthnAlgo[algorithm as keyof typeof WebAuthnAlgo],
        userHandle,
      },
    };

    const identityAccount = await this.repo.createIdentityAndAuthenticator(creationData);
    const dewt = await signDeWT(identityAccount);
    return { dewt, backupKey };
  }

  private async handleAuthentication(
    authenticationData: AuthenticationJSON,
    expectedChallenge: string
  ): Promise<ILoginResult> {
    const { id: credentialID } = authenticationData;
    if (!credentialID)
      throw new AppError(ApiCode.VALIDATION_ERROR, ERROR_MESSAGES.CREDENTIAL_ID_MISSING);

    const authenticator = await this.repo.findAuthenticatorByCredentialId(credentialID);
    if (!authenticator)
      throw new AppError(ApiCode.NOT_FOUND, ERROR_MESSAGES.AUTHENTICATOR_NOT_FOUND);

    const verification = await verifyAuthentication(
      authenticationData,
      authenticator,
      expectedChallenge
    );
    await this.repo.updateAuthenticatorCounter(authenticator.id, verification.counter);

    const identityAccount = await this.repo.findIdentityAccountById(
      authenticator.identityAccountId
    );
    if (!identityAccount)
      throw new AppError(ApiCode.SERVER_ERROR, ERROR_MESSAGES.IDENTITY_NOT_FOUND);

    const dewt = await signDeWT(identityAccount);
    return { dewt };
  }

  // Info: (20250926 - Tzuhan) 【新增】啟動備份碼恢復流程
  public async initiateRecovery(backupKey: string) {
    const hashedKey = await hashBackupKey(backupKey);
    const identityAccount = await this.repo.findIdentityByBackupKeyHash(hashedKey);

    if (!identityAccount) {
      throw new AppError(ApiCode.UNAUTHORIZED, ERROR_MESSAGES.INVALID_BACKUP_KEY);
    }

    // Info: (20250926 - Tzuhan) 為這個新裝置生成一個新的 userHandle
    const newUserHandle = randomUUID();
    const options = generateRegistrationOptions({
      name: identityAccount.name || `user-${identityAccount.id.substring(0, 6)}`,
      userHandle: newUserHandle,
    });

    // Info: (20250926 - Tzuhan) 將 identityId 和 newUserHandle 存入 session，以便下一步驗證
    const sessionData = {
      challenge: options.challenge,
      recovery: {
        identityId: identityAccount.id,
        userHandle: newUserHandle,
      },
    };

    return { options, sessionData };
  }

  // Info: (20250926 - Tzuhan) 【新增】完成備份碼恢復流程 (新增裝置)
  public async completeRecovery(
    registrationData: RegistrationJSON,
    expectedChallenge: string,
    identityId: string,
    expectedUserHandle: string
  ): Promise<ILoginResult> {
    // Info: (20250926 - Tzuhan) 驗證 FIDO2 註冊資料
    const verification = await verifyRegistration(registrationData, expectedChallenge);
    const { id: credentialID, publicKey: credentialPublicKey, algorithm } = verification.credential;
    const { id: userHandle } = registrationData.user;

    // Info: (20250926 - Tzuhan) 安全性檢查：確保 userHandle 與 session 中的一致
    if (!userHandle || userHandle !== expectedUserHandle) {
      throw new AppError(ApiCode.VALIDATION_ERROR, ERROR_MESSAGES.RECOVERY_SESSION_INVALID);
    }

    const newAuthenticatorData: IAddAuthenticatorData = {
      credentialID,
      credentialPublicKey,
      counter: verification.authenticator.counter,
      algorithm: WebAuthnAlgo[algorithm as keyof typeof WebAuthnAlgo],
      userHandle,
    };

    // Info: (20250926 - Tzuhan) 將新裝置綁定到現有帳戶
    await this.repo.addAuthenticatorToIdentity(identityId, newAuthenticatorData);

    // Info: (20250926 - Tzuhan) 再次從資料庫獲取完整的身份資訊以簽發 DeWT
    const identityAccount = await this.repo.findIdentityAccountById(identityId);
    if (!identityAccount) {
      throw new AppError(ApiCode.SERVER_ERROR, ERROR_MESSAGES.IDENTITY_NOT_FOUND);
    }

    const dewt = await signDeWT(identityAccount);
    // Info: (20250926 - Tzuhan) 恢復流程不回傳備份碼
    return { dewt };
  }
}

export const webAuthnService = new WebAuthnService(webAuthnRepo);
