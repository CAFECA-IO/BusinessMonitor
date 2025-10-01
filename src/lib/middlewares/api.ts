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
    // Info: (20250925 - Tzuhan) 仍然可以附加 request-id
    res.headers.set('x-request-id', requestId);
    return res;
  }

  /**
   * Info: (20251001-tzuhan) 【更新】2. 處理公開路由
   * 將 QR Code 登入和 Pusher 授權所需的路徑加入白名單
   */
  if (
    pathname.startsWith('/api/v1/public') ||
    pathname.startsWith('/api/v1/companies') ||
    pathname === '/api/v1/pairing/initiate' || // Info: (20251001-tzuhan) QR Code 登入流程
    pathname === '/api/v1/pusher/auth' // Info: (20251001-tzuhan) Pusher 頻道授權
  ) {
    const res = NextResponse.next();
    res.headers.set('x-request-id', requestId);
    return res;
  }

  // Info: (20250925 - Tzuhan) 3. 處理 FIDO2 相關的 /secure 路由
  if (pathname.startsWith('/api/v1/secure')) {
    // Info: (20250925 - Tzuhan) 【關鍵邏輯】處理 /me 的特殊情況
    if (pathname.endsWith('/me')) {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      if (!token) {
        // Info: (20251001-tzuhan) 如果沒有 token，重寫到訪客 API
        const rewriteUrl = req.nextUrl.clone();
        rewriteUrl.pathname = '/api/v1/public/guest-info';
        const res = NextResponse.rewrite(rewriteUrl);
        res.headers.set('x-request-id', requestId);
        return res;
      }
      // Info: (20251001-tzuhan) 如果有 token，則繼續往下走，進入下面的 DeWT 驗證邏輯
    } else {
      // Info: (20251001-tzuhan) /secure 下的其他路由（如 webauthn_options）直接放行
      const res = NextResponse.next();
      res.headers.set('x-request-id', requestId);
      return res;
    }
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
