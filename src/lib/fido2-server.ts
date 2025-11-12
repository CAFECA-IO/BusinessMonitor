import { server } from '@passwordless-id/webauthn';
import type {
  RegistrationJSON,
  AuthenticationJSON,
  RegistrationInfo,
  AuthenticationInfo,
  CredentialInfo,
  NamedAlgo,
  User,
} from '@passwordless-id/webauthn/dist/esm/types';
import type { Authenticator } from '@prisma/client';

/**
 * Info: (20250917 - Tzuhan)
 * 為 FIDO2 流程生成一個密碼學安全的隨機 Challenge。
 * 使用 @passwordless-id/webauthn 內建的函數以保持一致性。
 * @returns {string} Base64URL 編碼的隨機字串。
 */
export const generateChallenge = (): string => {
  return server.randomChallenge();
};

// Info: (20250917 - Tzuhan) --- 註冊流程 (Registration) ---

/**
 * Info: (20250917 - Tzuhan)
 * 為新用戶生成 FIDO2 註冊選項。
 * @param {object} params - 包含用戶基本資訊。
 * @param {string} params.name - 用戶的顯示名稱。
 * @param {string} params.userHandle - 一個唯一的、持久的用戶識別碼 (不應包含 PII)。
 * @returns FIDO2 註冊選項物件。
 */
export const generateRegistrationOptions = (params: { name: string; userHandle: string }) => {
  const challenge = generateChallenge();

  const user: User = {
    id: params.userHandle,
    name: params.name, // Info: (20250917 - Tzuhan) 函式庫要求 name 欄位
    displayName: params.name,
  };

  const options = {
    challenge,
    user,
    attestation: 'direct',
    authenticatorSelection: {
      userVerification: 'required' as const,
      residentKey: 'required' as const, // Info: (20250917 - Tzuhan) 啟用「可發現憑證」
    },
    pubKeyCredParams: [
      {
        type: 'public-key' as const,
        alg: -7, // Info: (20251112 - Tzuhan) ES256 (P-256)
      },
    ],
  };
  return options;
};

/**
 * Info: (20250917 - Tzuhan) 驗證前端回傳的 FIDO2 註冊數據。
 * @param {RegistrationJSON} registration - 從前端 client.register() 獲得的 JSON 物件。
 * @param {string} expectedChallenge - 存在伺服器端 (如 cookie) 的預期 Challenge。
 * @returns {Promise<RegistrationInfo>} 驗證成功後的回傳資訊，包含公鑰和演算法。
 */
export const verifyRegistration = async (
  registration: RegistrationJSON,
  expectedChallenge: string
): Promise<RegistrationInfo> => {
  const expected = {
    challenge: expectedChallenge,
    origin: process.env.NEXT_PUBLIC_ORIGIN!,
  };

  return await server.verifyRegistration(registration, expected);
};

// Info: (20250917 - Tzuhan) --- 登入流程 (Authentication) ---

/**
 * Info: (20250917 - Tzuhan)
 * 為用戶生成 FIDO2 登入選項。
 * @param {Authenticator[]} [authenticators] - (可選) 用戶已註冊的裝置列表。如果提供，將限制只能使用這些裝置登入。如果為空，則觸發「可發現憑證」流程。
 * @returns FIDO2 登入選項物件。
 */
export const generateAuthenticationOptions = (authenticators?: Authenticator[]) => {
  const challenge = generateChallenge();

  const options = {
    challenge,
    allowCredentials:
      authenticators?.map((auth) => ({
        id: auth.credentialID,
        type: 'public-key' as const,
      })) || [],
    userVerification: 'required' as const,
  };
  return options;
};

/**
 * Info: (20250917 - Tzuhan)
 * 驗證前端回傳的 FIDO2 登入數據。
 * @param {AuthenticationJSON} authentication - 從前端 client.authenticate() 獲得的 JSON 物件。
 * @param {Authenticator} authenticator - 從資料庫中查找到的、與此次登入對應的裝置紀錄。
 * @param {string} expectedChallenge - 存在伺服器端 (如 cookie) 的預期 Challenge。
 * @returns {Promise<AuthenticationInfo>} 驗證成功後的回傳資訊，包含新的簽名計數器。
 */
export const verifyAuthentication = async (
  authentication: AuthenticationJSON,
  authenticator: Authenticator,
  expectedChallenge: string
): Promise<AuthenticationInfo> => {
  const credential = {
    id: authenticator.credentialID,
    publicKey: authenticator.credentialPublicKey,
    algorithm: authenticator.algorithm as NamedAlgo,
  } as CredentialInfo;

  const expected = {
    challenge: expectedChallenge,
    origin: process.env.NEXT_PUBLIC_ORIGIN!,
    userVerified: true,
    counter: Number(authenticator.counter), // Info: (20250917 - Tzuhan) 將 BigInt 轉換為 number
  };

  return await server.verifyAuthentication(authentication, credential, expected);
};
