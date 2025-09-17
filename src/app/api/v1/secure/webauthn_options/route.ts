import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { server } from '@passwordless-id/webauthn';

export async function GET() {
  // Info: (20250917 - Tzuhan) 對於無使用者名稱登入，我們不需要 `user` 或 `authenticators`
  // Info: (20250917 - Tzuhan) 我們只生成一個 challenge
  const challenge = server.randomChallenge();

  // Info: (20250917 - Tzuhan) 將 challenge 存入安全的 httpOnly cookie，用於稍後的驗證
  const cookieStore = await cookies();

  cookieStore.set('webauthn-challenge', challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/',
    maxAge: 120, // 2分鐘有效
  });
  // Info: (20250917 - Tzuhan) 注意：這裡回傳的是一個 AuthenticationOptions 物件
  // Info: (20250917 - Tzuhan) 因為我們不知道用戶是誰，所以不提供 `allowCredentials`
  return NextResponse.json({ challenge });
}
