import { NextRequest, NextResponse } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import { i18nConfig } from 'i18n-config';
import { jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { verifyDeWT } from '@/lib/dewt';
import { ORIGIN } from '@/constants/dewt';

// Info: (20250910 - Tzuhan) --- CORS & Headers Configuration ---
const ALLOW_ORIGIN = ORIGIN!; // Info: (20250910 - Tzuhan) 直接從 env 獲取
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

  // Info: (20250910 - Tzuhan) 優先處理非 API 路由的 i18n
  if (!pathname.startsWith('/api')) {
    return i18nRouter(req, i18nConfig);
  }

  // Info: (20250910 - Tzuhan) --- API 請求處理 ---
  const requestId = crypto.randomUUID();

  // Info: (20250910 - Tzuhan) 處理 CORS 預檢請求
  if (req.method === 'OPTIONS') {
    return withCors(NextResponse.json({}, { status: 204 }), requestId);
  }

  // Info: (20250910 - Tzuhan) 取得 Authorization Header
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  try {
    const payload = token ? await verifyDeWT(token) : null;

    // Info: (20250910 - Tzuhan) 將 user-id 和 scope 注入 headers，方便後續 API 使用
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-request-id', requestId);
    if (payload?.sub) {
      requestHeaders.set('x-user-id', payload.sub);
      requestHeaders.set('x-user-scope', (payload.scope ?? []).join(','));
    }

    const nextResponse = NextResponse.next({ request: { headers: requestHeaders } });
    return withCors(nextResponse, requestId);
  } catch (error) {
    // Info: (20250910 - Tzuhan) Token 驗證失敗 (過期、簽章錯誤等)
    const message = error instanceof Error ? error.message : 'Invalid token';
    const response = jsonFail(ApiCode.UNAUTHENTICATED, message);
    return withCors(response, requestId);
  }
}

// Info: (20250910 - Tzuhan) --- Matcher Configuration ---
export const config = {
  /* Info: (20250910 - Tzuhan)
   * matcher 只匹配需要保護的 API 路徑。
   * /public 和 /secure 路徑不在此列，因此不會執行此 middleware 的 DeWT 驗證。
   * i18n 的 matcher 確保頁面路由能正常運作。
   */
  matcher: [
    // Info: (20250910 - Tzuhan) 受保護的 API 路徑
    '/api/v1/auth/:path*',
    '/api/v1/service/:path*',
    '/api/v1/admin/:path*',

    // Info: (20250910 - Tzuhan) 非 API 路徑，交給 i18n 處理
    '/((?!api|static|.*\\..*|_next).*)',
  ],
};
