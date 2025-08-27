import { NextRequest, NextResponse } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import { i18nConfig } from 'i18n-config';
import { fail } from '@/lib/response';
import { ApiCode } from '@/lib/status';

const API_PREFIX = '/api/';
const PUBLIC_API_PATHS: (string | RegExp)[] = ['/api/health', /^\/api\/v1\/public(\/.*)?$/];

const PUBLIC_GET_PATHS: RegExp[] = [
  /^\/api\/v1\/companies\/\d+\/basic$/,
  /^\/api\/v1\/companies\/\d+\/view$/,
  /^\/api\/v1\/companies\/\d+\/market$/,
  /^\/api\/v1\/companies\/\d+\/news$/,
  /^\/api\/v1\/companies\/\d+\/flags$/,
  /^\/api\/v1\/companies\/\d+\/comments$/,
  /^\/api\/v1\/companies\/\d+\/operations(?:\/.*)?$/,
  /^\/api\/v1\/companies\/search$/,
  /^\/api\/v1\/companies\/new$/,
  /^\/api\/v1\/companies\/most-viewed$/,
];

const ALLOW_ORIGIN = process.env.NEXT_PUBLIC_WEB_ORIGIN ?? '*';
const ALLOW_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const ALLOW_HEADERS = 'Content-Type,Authorization,X-Requested-With,X-Request-Id';
const EXPOSE_HEADERS = 'X-Request-Id';

const isPublicApi = (pathname: string): boolean =>
  PUBLIC_API_PATHS.some((p) => (typeof p === 'string' ? pathname.startsWith(p) : p.test(pathname)));
const isPublicGet = (pathname: string): boolean => PUBLIC_GET_PATHS.some((re) => re.test(pathname));

function withCors(res: NextResponse, requestId?: string): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.headers.set('Access-Control-Allow-Methods', ALLOW_METHODS);
  res.headers.set('Access-Control-Allow-Headers', ALLOW_HEADERS);
  res.headers.set('Access-Control-Expose-Headers', EXPOSE_HEADERS);
  if (requestId) res.headers.set('x-request-id', requestId);
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Info:（20250808 - Tzuhan）1) 只要是 /api/*，走 API middleware
  if (pathname.startsWith(API_PREFIX)) {
    // Info:（20250808 - Tzuhan）CORS Preflight
    if (req.method === 'OPTIONS') {
      return withCors(NextResponse.json({}, { status: 204 }));
    }

    // Info:（20250808 - Tzuhan）requestId
    const requestId = crypto.randomUUID();
    const nextHeaders = new Headers(req.headers);
    nextHeaders.set('x-request-id', requestId);

    // Info:（20250808 - Tzuhan）公開 API 直接放行（附 CORS + requestId）

    if (isPublicApi(pathname) || isPublicGet(pathname)) {
      return withCors(NextResponse.next({ request: { headers: nextHeaders } }), requestId);
    }

    // Info:（20250808 - Tzuhan）檢查是否帶 Bearer；真正驗簽交給 handler（lib/auth.ts）
    const auth = req.headers.get('authorization') ?? '';
    const hasBearer = /^Bearer\s+.+$/i.test(auth);
    if (!hasBearer) {
      return withCors(
        NextResponse.json(fail(ApiCode.UNAUTHENTICATED, 'Missing Bearer token'), { status: 401 }),
        requestId
      );
    }

    return withCors(NextResponse.next({ request: { headers: nextHeaders } }), requestId);
  }

  // Info:（20250808 - Tzuhan）2) 非 /api/* 路徑走 i18nRouter
  return i18nRouter(req, i18nConfig);
}

// Info:（20250808 - Tzuhan）同時攔 API 與前端頁面（避開 _next、static、檔案等）
export const config = {
  matcher: ['/api/:path*', '/((?!api|static|.*\\..*|_next).*)'],
};
