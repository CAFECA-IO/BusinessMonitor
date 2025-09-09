import { NextRequest } from 'next/server';
import { verifySession, COOKIE_NAME } from '@/lib/session';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';

// FIDO2 專用的後端使用者物件
export type AuthUser = {
  id: string; // userId (= JWT.sub)
  scope: string[]; // 權限（JWT.scope）
  amr: ['fido2']; // 僅接受 FIDO2
  credIdHash?: string; // 之後裝置綁定可用（可選）
};

export async function assertAuth(req: NextRequest): Promise<AuthUser> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) throw new AppError(ApiCode.UNAUTHENTICATED, 'Missing session cookie');

  try {
    const payload = await verifySession(token);
    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    if (!sub) throw new AppError(ApiCode.UNAUTHENTICATED, 'Invalid session (no sub)');
    const amr = Array.isArray(payload.amr) ? (payload.amr as unknown[]) : [];
    if (!amr.includes('fido2'))
      throw new AppError(ApiCode.UNAUTHENTICATED, 'Login method not allowed');
    const scope = Array.isArray(payload.scope) ? (payload.scope as string[]) : [];
    const credIdHash = typeof payload.credIdHash === 'string' ? payload.credIdHash : undefined;
    return { id: sub, scope, amr: ['fido2'], credIdHash };
  } catch {
    throw new AppError(ApiCode.UNAUTHENTICATED, 'Invalid or expired session');
  }
}
