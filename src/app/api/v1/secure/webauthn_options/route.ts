import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateRegistrationOptions, generateAuthenticationOptions } from '@/lib/fido2-server';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
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
  }

  return NextResponse.json(options);
}
