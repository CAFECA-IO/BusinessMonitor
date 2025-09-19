import type {
  RegistrationJSON,
  AuthenticationJSON,
} from '@passwordless-id/webauthn/dist/esm/types';
import { verifyAuthentication, verifyRegistration } from '@/lib/fido2-server';
import { signDeWT } from '@/lib/dewt';
import { generateEthereumKeyPair, encryptPrivateKey } from '@/lib/eth-keys';
import { generateBackupKey, hashBackupKey } from '@/lib/backup-key';
import { webAuthnRepo, CreateIdentityData } from '@/repositories/webauthn.repo';
import { IdentityAccount, WebAuthnAlgo } from '@prisma/client';

interface LoginResult {
  dewt: string;
  backupKey?: string;
}

class WebAuthnService {
  public async loginOrRegister(
    fido2Response: RegistrationJSON | AuthenticationJSON,
    expectedChallenge: string
  ): Promise<LoginResult> {
    // 關鍵點：首先，明確判斷請求是註冊還是登入。
    // RegistrationJSON 的 response 物件必定包含 `attestationObject`。
    const isRegistration = 'attestationObject' in fido2Response.response;

    if (isRegistration) {
      // --- 註冊流程 ---
      const registrationData = fido2Response as RegistrationJSON;

      const verification = await verifyRegistration(registrationData, expectedChallenge);

      const {
        id: credentialID,
        publicKey: credentialPublicKey,
        algorithm,
      } = verification.credential;
      const { counter } = verification.authenticator;
      const userHandle = registrationData.user.id;
      if (!userHandle) {
        throw new Error('User handle not found in FIDO2 registration response.');
      }

      const ethKeyPair = generateEthereumKeyPair();
      const backupKey = generateBackupKey();

      const creationData: CreateIdentityData = {
        name: `User ${userHandle.substring(0, 6)}`,
        ethereumAddress: ethKeyPair.address,
        encryptedPrivateKey: encryptPrivateKey(ethKeyPair.privateKey),
        backupKeyHash: await hashBackupKey(backupKey),
        credential: {
          credentialID,
          credentialPublicKey,
          counter,
          algorithm: WebAuthnAlgo[algorithm as keyof typeof WebAuthnAlgo],
          userHandle,
        },
      };

      console.log('Creating identity with data:', creationData);

      const identityAccount = await webAuthnRepo.createIdentityAndAuthenticator(creationData);
      const dewt = await signDeWT(identityAccount);
      return { dewt, backupKey };
    } else {
      // --- 登入流程 ---
      const authenticationData = fido2Response as AuthenticationJSON;
      const credentialID = authenticationData.id;
      if (!credentialID) {
        throw new Error('Credential ID missing from authenticator response.');
      }

      // 在登入流程中，如果找不到驗證器，就必須拋出錯誤。
      // 絕不能進入註冊流程。
      const authenticator = await webAuthnRepo.findAuthenticatorByCredentialId(credentialID);
      if (!authenticator) {
        throw new Error('Authenticator not found. This device may not be registered.');
      }

      const verification = await verifyAuthentication(
        authenticationData,
        authenticator,
        expectedChallenge
      );

      await webAuthnRepo.updateAuthenticatorCounter(authenticator.id, verification.counter);

      const identityAccount = await webAuthnRepo.findIdentityAccountById(
        authenticator.identityAccountId
      );
      if (!identityAccount) {
        throw new Error('Identity account not found for existing authenticator.');
      }

      const dewt = await signDeWT(identityAccount);
      return { dewt };
    }
  }
}

export const webAuthnService = new WebAuthnService();
