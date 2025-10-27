import type {
  RegistrationJSON,
  AuthenticationJSON,
} from '@passwordless-id/webauthn/dist/esm/types';
import { verifyAuthentication, verifyRegistration } from '@/lib/fido2-server';
import { signDeWT } from '@/lib/dewt';
import { generateEthereumKeyPair, encryptPrivateKey } from '@/lib/eth-keys';
import type { IWebAuthnRepository, ICreateIdentityData } from '@/repositories/webauthn.repo';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { WebAuthnAlgo } from '@prisma/client';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';

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

    const creationData: ICreateIdentityData = {
      name: `User ${userHandle.substring(0, 6)}`,
      ethereumAddress: ethKeyPair.address,
      encryptedPrivateKey: encryptPrivateKey(ethKeyPair.privateKey),
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
    return { dewt };
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
}

export const webAuthnService = new WebAuthnService(webAuthnRepo);
