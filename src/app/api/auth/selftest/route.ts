import { NextRequest, NextResponse } from 'next/server';
import { signSession, verifySession, buildSessionCookie } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  // Info: (20250909 - Tzuhan) 開發用：模擬一顆 FIDO2 來源的 Session（正式環境改用 webauthn/login/verify 簽發）
  const token = await signSession({
    sub: 'u_test',
    scope: ['user'],
    amr: ['fido2'], // Info: (20250909 - Tzuhan) ← 關鍵
    acr: 'low',
    // Info: (20250909 - Tzuhan) credIdHash: '... 可選，從 Credential ID sha256 得到',
  });

  const payload = await verifySession(token);
  const res = NextResponse.json({ ok: true, payload });
  res.headers.append('Set-Cookie', buildSessionCookie(token));
  return res;
}
