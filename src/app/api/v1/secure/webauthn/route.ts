import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { webAuthnService } from '@/services/webauthn.services';

export async function POST(request: Request) {
  try {
    const fido2Response = await request.json();
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get('webauthn-session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Session expired. Please try again.' }, { status: 400 });
    }

    // Info: (20250919 - Tzuhan) 從 cookie 中解析出 challenge
    const { challenge } = JSON.parse(sessionCookie.value);
    if (!challenge) {
      return NextResponse.json({ error: 'Invalid session: challenge missing.' }, { status: 400 });
    }

    // Info: (20250919 - Tzuhan) 將所有複雜邏輯交給 Service 層處理
    const result = await webAuthnService.loginOrRegister(fido2Response, challenge);

    // Info: (20250919 - Tzuhan) 清除 session cookie
    cookieStore.delete('webauthn-session');

    // Info: (20250919 - Tzuhan) 回傳成功結果
    return NextResponse.json(result);
  } catch (error) {
    console.error('WebAuthn API Error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: (error as Error).message },
      { status: 400 }
    );
  }
}
