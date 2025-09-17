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
    // Info: (20250917 - Tzuhan) 根據 fido2Response 的結構來判斷是登入還是註冊，並取得 userHandle
    let userHandle: string | undefined;
    const isRegistration = 'user' in fido2Response;

    if (isRegistration) {
      // Info: (20250917 - Tzuhan) 註冊流程: userHandle 來自我們發送到前端的 user.id
      userHandle = (fido2Response as RegistrationJSON).user.id;
    } else {
      // Info: (20250917 - Tzuhan) 登入流程: userHandle 來自驗證器回傳的 response.userHandle
      userHandle = (fido2Response as AuthenticationJSON).response.userHandle;
    }

    if (!userHandle) {
      throw new Error('User handle could not be determined.');
    }

    const authenticator = await webAuthnRepo.findAuthenticatorByUserHandle(userHandle);
    let identityAccount: IdentityAccount | null;

    if (authenticator) {
      // Info: (20250917 - Tzuhan) --- 登入流程 ---
      const verification = await verifyAuthentication(
        fido2Response as AuthenticationJSON,
        authenticator,
        expectedChallenge
      );
      // Info: (20250917 - Tzuhan) 使用 `verification.counter` 而非 `verification.newCounter`
      await webAuthnRepo.updateAuthenticatorCounter(authenticator.id, verification.counter);
      identityAccount = await webAuthnRepo.findIdentityAccountById(authenticator.identityAccountId);
      if (!identityAccount)
        throw new Error('Identity account not found for existing authenticator.');

      const dewt = await signDeWT(identityAccount);
      return { dewt };
    } else {
      // Info: (20250917 - Tzuhan) --- 註冊流程 ---
      const verification = await verifyRegistration(
        fido2Response as RegistrationJSON,
        expectedChallenge
      );

      // Info: (20250917 - Tzuhan) 使用正確的屬性名 (id, publicKey) 和別名
      const {
        id: credentialID,
        publicKey: credentialPublicKey,
        algorithm,
      } = verification.credential;
      // Info: (20250917 - Tzuhan) counter 來自 authenticator 物件
      const { counter } = verification.authenticator;

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
          // Info: (20250917 - Tzuhan) 將 NamedAlgo (string) 轉為 Prisma Enum
          algorithm: WebAuthnAlgo[algorithm as keyof typeof WebAuthnAlgo],
          userHandle,
        },
      };

      identityAccount = await webAuthnRepo.createIdentityAndAuthenticator(creationData);

      const dewt = await signDeWT(identityAccount);
      return { dewt, backupKey };
    }
  }
}

export const webAuthnService = new WebAuthnService();
