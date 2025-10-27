import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { generateRegistrationOptions, generateAuthenticationOptions } from '@/lib/fido2-server';
import { randomUUID } from 'crypto';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const log = logger.child({ route: 'GET /api/v1/secure/webauthn-options' });
  try {
    // Info: (20250919 - Tzuhan) 檢查前端的 "意圖"
    const intent = request.nextUrl.searchParams.get('intent');

    let options;
    const cookieStore = await cookies();

    if (intent === 'register') {
      // Info: (20250919 - Tzuhan) --- 處理註冊意圖 ---
      const userHandle = randomUUID();
      options = generateRegistrationOptions({
        name: `user-${userHandle.substring(0, 6)}`,
        userHandle,
      });
      // Info: (20250919 - Tzuhan) 將 challenge 和 userHandle 都存起來，待後續註冊驗證
      cookieStore.set(
        'webauthn-session',
        JSON.stringify({ challenge: options.challenge, userHandle }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV !== 'development',
          sameSite: 'strict',
          path: '/',
          maxAge: 120,
        }
      );
      log.info('Generated registration options', { intent: 'register' });
    } else {
      // Info: (20250919 - Tzuhan) --- 預設為登入意圖 ---
      options = generateAuthenticationOptions(); // Info: (20250919 - Tzuhan) 不傳入 allowCredentials 以啟用無使用者名稱登入
      // Info: (20250919 - Tzuhan) 只需儲存 challenge
      cookieStore.set('webauthn-session', JSON.stringify({ challenge: options.challenge }), {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        path: '/',
        maxAge: 120,
      });
      log.info('Generated authentication options', { intent: 'login' });
    }

    return jsonOk(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate WebAuthn options.';
    log.error('Error generating WebAuthn options', { error: message });
    return jsonFail(ApiCode.SERVER_ERROR, message);
  }
}
