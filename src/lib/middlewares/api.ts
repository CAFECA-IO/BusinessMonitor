import { NextRequest, NextResponse } from 'next/server';
import { jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { verifyDeWT } from '@/lib/dewt';

/**
 * Info: (20250925 - Tzuhan)
 * 這是一個專門處理所有 API 請求的中介軟體。
 * 它的職責包括：處理預檢請求、區分公私有路由、驗證 DeWT。
 */
export async function apiMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestId = crypto.randomUUID();

  /**
   * Info: (20250925 - Tzuhan) 1. 處理 CORS 預檢請求 (OPTIONS)
   * 雖然 headers 已在 next.config.js 設定，但 OPTIONS 請求仍需回傳 204
   */
  if (req.method === 'OPTIONS') {
    const res = NextResponse.json({}, { status: 204 });
    res.headers.set('x-request-id', requestId);
    return res;
  }

  // Info: (20251017 - Tzuhan) 2. 處理「絕對公開」的路由
  const publicRoutes = [
    '/api/v1/public',
    '/api/v1/companies',
    '/api/v1/pairing/initiate',
    '/api/v1/pairing/authorize',
    '/api/v1/pairing/complete',
    '/api/v1/pusher/auth',
    '/api/v1/upload',
  ];

  if (publicRoutes.some((path) => pathname.startsWith(path))) {
    const res = NextResponse.next();
    res.headers.set('x-request-id', requestId);
    return res;
  }

  // Info: (20251017 - Tzuhan): 3. 處理 FIDO2 相關的 /secure 路由，區分公開與私有
  if (pathname.startsWith('/api/v1/secure')) {
    // Info: (20251017 - Tzuhan) 這些是 /secure 下「無需 token」即可訪問的公開路由
    const securePublicRoutes = [
      '/api/v1/secure/webauthn-options',
      '/api/v1/secure/webauthn',
      '/api/v1/secure/recover/initiate',
      '/api/v1/secure/recover/complete',
      '/api/v1/secure/verify-login',
    ];

    if (securePublicRoutes.some((path) => pathname.startsWith(path))) {
      // Info: (20251017 - Tzuhan) 如果是公開的 /secure 路由，直接放行
      const res = NextResponse.next();
      res.headers.set('x-request-id', requestId);
      return res;
    }

    // Info: (20251017 - Tzuhan) 所有未在 securePublicRoutes 中列出的 /secure 路由 (例如 /me 和 /key-management/store)
    // Info: (20251017 - Tzuhan) 將會自動落到下面的 Token 驗證邏輯。
  }

  // Info: (20251001-tzuhan) 4. 處理所有需要 DeWT 的路由 (/auth, /service, /admin, 以及帶有 token 的 /me)
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return jsonFail(ApiCode.UNAUTHORIZED, 'Missing token', {
      headers: { 'x-request-id': requestId },
    });
  }

  try {
    const payload = await verifyDeWT(token);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-request-id', requestId);
    requestHeaders.set('x-identity-id', payload.sub as string);
    if (payload.scope) {
      requestHeaders.set('x-user-scope', (payload.scope as string[]).join(','));
    }

    // Info: (20251001-tzuhan) 檢查管理員權限
    if (pathname.startsWith('/api/v1/admin') && !(payload.scope as string[])?.includes('admin')) {
      return jsonFail(ApiCode.FORBIDDEN, 'Insufficient permissions', {
        headers: { 'x-request-id': requestId },
      });
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    return jsonFail(ApiCode.UNAUTHORIZED, message, {
      headers: { 'x-request-id': requestId },
    });
  }
}
