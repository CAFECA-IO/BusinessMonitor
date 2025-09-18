import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateRegistrationOptions, generateAuthenticationOptions } from '@/lib/fido2-server';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  // 檢查前端的 "意圖"
  const intent = request.nextUrl.searchParams.get('intent');

  let options;
  const cookieStore = await cookies();

  if (intent === 'register') {
    // --- 處理註冊意圖 ---
    const userHandle = randomUUID();
    options = generateRegistrationOptions({
      name: `user-${userHandle.substring(0, 6)}`,
      userHandle,
    });
    // 將 challenge 和 userHandle 都存起來，待後續註冊驗證
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
    // --- 預設為登入意圖 ---
    options = generateAuthenticationOptions(); // 不傳入 allowCredentials 以啟用無使用者名稱登入
    // 只需儲存 challenge
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
