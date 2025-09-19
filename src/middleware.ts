import { NextRequest, NextResponse } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import { i18nConfig } from 'i18n-config';
import { jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { verifyDeWT } from '@/lib/dewt';

const ALLOW_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || '*';
const ALLOW_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const ALLOW_HEADERS = 'Content-Type,Authorization';
const EXPOSE_HEADERS = 'X-Request-Id';

function withCors(res: NextResponse, requestId: string): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.headers.set('Access-Control-Allow-Methods', ALLOW_METHODS);
  res.headers.set('Access-Control-Allow-Headers', ALLOW_HEADERS);
  res.headers.set('Access-Control-Expose-Headers', EXPOSE_HEADERS);
  res.headers.set('Vary', 'Origin');
  res.headers.set('x-request-id', requestId);
  return res;
}

// Info: (20250910 - Tzuhan) --- Main Middleware Logic ---
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestId = crypto.randomUUID();

  // Info: (20250910 - Tzuhan)1. 優先處理非 API 路由的 i18n
  if (!pathname.startsWith('/api')) {
    return i18nRouter(req, i18nConfig);
  }

  // Info: (20250910 - Tzuhan) --- API 請求處理 ---

  // Info: (20250910 - Tzuhan) 2. 處理 CORS 預檢請求
  if (req.method === 'OPTIONS') {
    return withCors(NextResponse.json({}, { status: 204 }), requestId);
  }

  // Info: (20250910 - Tzuhan) 3. 根據路由前綴決定保護級別
  //    - /public: 完全開放
  if (pathname.startsWith('/api/v1/public') || pathname.startsWith('/api/v1/companies')) {
    const res = NextResponse.next();
    return withCors(res, requestId);
  }
  // Info: (20250917 - Tzuhan)  - /secure: FIDO2 相關，不需 DeWT，但有其他機制 (如 cookie challenge)
  if (pathname.startsWith('/api/v1/secure')) {
    // Info: (20250917 - Tzuhan)【關鍵邏輯】處理 /me 的特殊情況
    if (pathname.endsWith('/me')) {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      if (!token) {
        // Info: (20250917 - Tzuhan) 如果沒有 token，重寫到訪客 API，實現「未登入則為訪客資訊」
        const rewriteUrl = req.nextUrl.clone();
        rewriteUrl.pathname = '/api/v1/public/guest-info';
        const res = NextResponse.rewrite(rewriteUrl);
        return withCors(res, requestId);
      }
      // Info: (20250917 - Tzuhan) 如果有 token，則繼續往下走，進入下面的 DeWT 驗證邏輯
    } else {
      const res = NextResponse.next();
      return withCors(res, requestId);
    }
  }

  // 4. Info: (20250917 - Tzuhan) 處理所有需要 DeWT 的路由 (/auth, /service, /admin, 以及帶有 token 的 /me)
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    const response = jsonFail(ApiCode.UNAUTHENTICATED, 'Missing token');
    return withCors(response, requestId);
  }

  try {
    const payload = await verifyDeWT(token);

    // Info: (20250917 - Tzuhan) 注入 user-id 和 scope 等資訊到 request headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-request-id', requestId);
    requestHeaders.set('x-identity-id', payload.sub as string);
    if (payload.scope) {
      requestHeaders.set('x-user-scope', (payload.scope as string[]).join(','));
    }

    // Info: (20250917 - Tzuhan) 檢查管理員權限
    if (pathname.startsWith('/api/v1/admin') && !(payload.scope as string[])?.includes('admin')) {
      const response = jsonFail(ApiCode.FORBIDDEN, 'Insufficient permissions');
      return withCors(response, requestId);
    }

    const nextResponse = NextResponse.next({ request: { headers: requestHeaders } });
    return withCors(nextResponse, requestId);
  } catch (error) {
    // Info: (20250917 - Tzuhan)Token 驗證失敗 (過期、簽章錯誤等)
    const message = error instanceof Error ? error.message : 'Invalid token';
    const response = jsonFail(ApiCode.UNAUTHENTICATED, message);
    return withCors(response, requestId);
  }
}

// Info: (20250917 - Tzuhan) --- Matcher Configuration ---
export const config = {
  matcher: ['/api/v1/:path*', '/((?!api|static|.*\\..*|_next).*)'],
};
