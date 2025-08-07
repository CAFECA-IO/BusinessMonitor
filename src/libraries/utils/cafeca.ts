import { client, server, utils } from "@passwordless-id/webauthn";
import { RegistrationInfo, RegistrationJSON } from "@passwordless-id/webauthn/dist/esm/types";

type Fido2ExpectedData = {
  challenge: string;
  origin: string;
  userVerified: boolean;
  counter: number;
};

const getChallenge = async (loginData: Record<string, unknown>): Promise<string> => {
  const loginDataString = JSON.stringify(loginData);
  const loginDataBuffer = utils.toBuffer(loginDataString);
  const loginDataHash = await utils.sha256(loginDataBuffer);
  const challenge = utils.bufferToHex(loginDataHash);
  return challenge;
};

const getUserData = async (loginData: Record<string, unknown>): Promise<[RegistrationJSON, Fido2ExpectedData]> => {
  const challenge = await getChallenge(loginData);
  const registrationOptions = {
    user: { id: 'cafeca-user-id', name: 'cafeca-user', displayName: 'CAFECA' },
    challenge,
    customProperties: {
      excludeCredentials: [
        {
          id: utils.toBuffer('base64url-credential-id'),
          type: 'public-key',
        },
      ],
    },
  };
  const userData = await client.register(registrationOptions);
  const expectedData = {
    challenge,
    origin: "http://localhost:3000",
    userVerified: true,
    counter: -1
  };
  return [userData, expectedData];
}

const verifyUser = async (userData: RegistrationJSON, expectedData: Fido2ExpectedData): Promise<RegistrationInfo> => {
  const verificationResult = server.verifyRegistration(userData, expectedData);
  return verificationResult;
}

export { getChallenge, getUserData, verifyUser };
