import { client, server, utils } from '@passwordless-id/webauthn';
import { RegistrationInfo, RegistrationJSON } from '@passwordless-id/webauthn/dist/esm/types';

export type JsonPrimative = string | number | boolean | null;
export type JsonArray = Json[];
export type JsonObject = { [key: string]: Json };
export type JsonComposite = JsonArray | JsonObject;
export type Json = JsonPrimative | JsonComposite;
export type Fido2ExpectedData = {
  challenge: string;
  origin: string;
  userVerified: boolean;
  counter: number;
};

const getChallenge = async (loginData: Json): Promise<string> => {
  const loginDataString = JSON.stringify(loginData);
  const loginDataBuffer = utils.toBuffer(loginDataString);
  const loginDataHash = await utils.sha256(loginDataBuffer);
  const challenge = utils.bufferToHex(loginDataHash);
  return challenge;
};

const getNewUserId = async (): Promise<string> => {
  const userId = 'aaa';
  return userId;
};

const registerUser = async (loginData: Json): Promise<string> => {
  const userId = await getNewUserId();
  const registrationOptions = {
    user: { id: userId, name: 'cafeca-user', displayName: 'CAFECA' },
    challenge: await getChallenge(loginData),
  };
  const userData = await client.register(registrationOptions);
  return userId;
};

const getUserData = async (loginData: Json): Promise<[RegistrationJSON, Fido2ExpectedData]> => {
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
    origin: 'http://localhost:3000',
    userVerified: true,
    counter: -1,
  };
  return [userData, expectedData];
};

const verifyUser = async (
  userData: RegistrationJSON,
  expectedData: Fido2ExpectedData
): Promise<RegistrationInfo> => {
  const verificationResult = server.verifyRegistration(userData, expectedData);
  return verificationResult;
};

export { getChallenge, getUserData, verifyUser };
