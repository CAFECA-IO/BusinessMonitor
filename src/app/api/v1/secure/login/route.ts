import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import * as loginService from '@/app/services/secure.login.service';
import { z } from 'zod';
import { ExtendedAuthenticatorTransport } from '@passwordless-id/webauthn/dist/esm/types';

// Info: (20250912 - Tzuhan) 使用 Zod 詳細定義 registrationData 的結構，參考 WebAuthn RegistrationResponseJSON
const RegistrationDataSchema = z.object({
  id: z.string().min(1),
  rawId: z.string().min(1),
  type: z.literal('public-key'),
  response: z.object({
    clientDataJSON: z.string().min(1),
    attestationObject: z.string().min(1),
    transports: z.array(z.string()),
    authenticatorData: z.string().min(1),
    publicKey: z.string().min(1),
    publicKeyAlgorithm: z.number(),
  }),
  clientExtensionResults: z.record(z.string(), z.unknown()),
  user: z.object({
    id: z.string(),
    name: z.string(),
    displayName: z.string().optional(),
  }),
});

// Info: (20250912 - Tzuhan) loginData 是一個 JSON 物件，用於產生 challenge
const LoginDataSchema = z.record(z.string(), z.unknown());

const LoginRequestSchema = z.object({
  loginData: LoginDataSchema,
  registrationData: RegistrationDataSchema,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Info: (20250912 - Tzuhan) 1. 驗證請求 body 的格式
    const validation = LoginRequestSchema.safeParse(body);
    if (!validation.success) {
      return jsonFail(ApiCode.VALIDATION_ERROR, '無效的請求內容結構', {
        status: 400,
      });
    }

    const { loginData, registrationData } = validation.data;

    // Info: (20250912 - Tzuhan) 2. 將業務邏輯委託給 Service 層處理
    const registrationDataWithTypedTransports = {
      ...registrationData,
      response: {
        ...registrationData.response,
        // Info: (20250912 - Tzuhan) 將 transports 轉型為 ExtendedAuthenticatorTransport[]
        transports: registrationData.response.transports as ExtendedAuthenticatorTransport[],
      },
    };

    const result = await loginService.authenticateOrRegister(
      JSON.stringify(loginData),
      registrationDataWithTypedTransports
    );

    // Info: (20250912 - Tzuhan) 3. 成功後回傳結果
    return jsonOk(result);
  } catch (error) {
    // Info: (20250912 - Tzuhan) 4. 捕捉 Service 層或其他地方拋出的錯誤
    const message = error instanceof Error ? error.message : '認證失敗';

    // Info: (20250912 - Tzuhan) FIDO2 驗證失敗通常回傳 401 Unauthorized
    return jsonFail(ApiCode.UNAUTHENTICATED, message);
  }
}
