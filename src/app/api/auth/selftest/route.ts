import { NextResponse } from 'next/server';
import { signSession, verifySession, buildSessionCookie } from '@/lib/session';
export const runtime = 'nodejs';

export async function GET() {
  const token = await signSession({ sub: 'u_test', scope: ['user'] });
  const payload = await verifySession(token);
  const res = NextResponse.json({ ok: true, payload });
  res.headers.append('Set-Cookie', buildSessionCookie(token));
  return res;
}
