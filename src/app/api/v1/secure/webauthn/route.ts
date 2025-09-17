import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { webAuthnService } from '@/services/webauthn.services';

export async function POST(request: Request) {
  try {
    const fido2Response = await request.json();
    const cookieStore = await cookies();

    const challengeCookie = cookieStore.get('webauthn-challenge');
    if (!challengeCookie) {
      return NextResponse.json({ error: 'Session expired. Please try again.' }, { status: 400 });
    }
    const expectedChallenge = challengeCookie.value;

    const result = await webAuthnService.loginOrRegister(fido2Response, expectedChallenge);

    // Info: (20250917 - Tzuhan) 清除 cookie
    cookieStore.delete('webauthn-challenge');

    return NextResponse.json(result);
  } catch (error) {
    console.error('WebAuthn API Error:', error);
    // Info: (20250917 - Tzuhan) 根據錯誤類型回傳更精確的狀態碼
    return NextResponse.json(
      { error: 'Verification failed', details: (error as Error).message },
      { status: 400 }
    );
  }
}
