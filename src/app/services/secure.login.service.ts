import { getChallenge, buildExpectedData, verifyUser, Fido2ExpectedData } from '@/lib/cafeca';
import * as loginRepo from '@/app/repositories/secure.login.repo';
import { signDeWT } from '@/lib/dewt';
import type { Json } from '@/lib/cafeca';
import type { RegistrationJSON } from '@passwordless-id/webauthn/dist/esm/types';
import type { User } from '@prisma/client';
import { env } from '@/lib/env';
import crypto from 'crypto';

/**
 * Info: (20250912 - Tzuhan)
 * 處理 FIDO2 的註冊或登入流程，完整實現了前端測試頁面的後端邏輯。
 * @param loginData - 用於在後端重新產生 challenge 的上下文 (Context)
 * @param registrationData - 從前端瀏覽器 client.register API 收到的 FIDO2 憑證資料
 * @returns - 回傳包含 DeWT 和使用者資訊的物件
 */
export async function authenticateOrRegister(
  loginData: Json,
  registrationData: RegistrationJSON
): Promise<{ dewt: string; user: { id: string; email: string | null } }> {
  // Info: (20250912 - Tzuhan) 1. 在後端根據前端傳來的 loginData 重新產生一模一樣的 challenge
  const challenge = await getChallenge(loginData);

  // Info: (20250912 - Tzuhan) 2. 在後端組裝 expectedData，用於驗證前端的 FIDO2 回應
  const expectedData = buildExpectedData(challenge);

  // Info: (20250912 - Tzuhan) 3. 呼叫 cafeca.ts 中的 verifyUser 來驗證 FIDO2 憑證的合法性
  const registrationInfo = await verifyUser(registrationData, expectedData);
  const { credential } = registrationInfo;

  // Info: (20250912 - Tzuhan) 4. 檢查憑證是否已存在於資料庫中
  let user: User;
  const existingCredential = await loginRepo.findCredentialWithUser(credential.id);

  if (existingCredential) {
    // Info: (20250912 - Tzuhan) a) 如果存在，視為「登入」，直接取得關聯的使用者資訊
    user = existingCredential.user;
  } else {
    // Info: (20250912 - Tzuhan) b) 如果不存在，視為「註冊」，建立新的使用者和憑證紀錄
    user = await loginRepo.createFidoUserAndCredential(registrationInfo);
  }

  // Info: (20250912 - Tzuhan) 5. 為成功驗證的使用者簽發 DeWT (JSON Web Token)
  const dewt = await signDeWT({
    sub: user.id,
    scope: ['user'], // Info: (20250912 - Tzuhan) 可根據使用者角色擴充
    amr: ['fido2'],
    credIdHash: crypto.createHash('sha256').update(credential.id).digest('hex'),
  });

  return {
    dewt,
    user: { id: user.id, email: user.email },
  };
}
