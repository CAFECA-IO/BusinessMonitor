import { NextRequest, NextResponse } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import { i18nConfig } from 'i18n-config';
import { jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';

const API_PREFIX = '/api/';
const PUBLIC = /^\/api\/v1\/public(\/.*)?$/;
const SECURE = /^\/api\/v1\/secure(\/.*)?$/;
const DEV = /^\/api\/v1\/dev(\/.*)?$/;

const ALLOW_ORIGIN = process.env.NEXT_PUBLIC_WEB_ORIGIN ?? '*';
const ALLOW_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const ALLOW_HEADERS = 'Content-Type,Authorization,X-Requested-With,X-Request-Id';
const EXPOSE_HEADERS = 'X-Request-Id';

function withCors(res: NextResponse, requestId?: string): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.headers.set('Access-Control-Allow-Methods', ALLOW_METHODS);
  res.headers.set('Access-Control-Allow-Headers', ALLOW_HEADERS);
  res.headers.set('Access-Control-Expose-Headers', EXPOSE_HEADERS);
  res.headers.set('Vary', 'Origin');
  if (requestId) res.headers.set('x-request-id', requestId);
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith(API_PREFIX)) {
    if (req.method === 'OPTIONS') {
      return withCors(NextResponse.json({}, { status: 204 }));
    }

    const requestId = crypto.randomUUID();
    const nextHeaders = new Headers(req.headers);
    nextHeaders.set('x-request-id', requestId);

    // Info: (20250910 - Tzuhan) 完全公開 & 安全前綴（登入/註冊/認證）— 不驗章，中介層直接放行
    if (PUBLIC.test(pathname) || SECURE.test(pathname)) {
      return withCors(NextResponse.next({ request: { headers: nextHeaders } }), requestId);
    }

    // Info: (20250910 - Tzuhan) dev 前綴 — production 關閉
    if (DEV.test(pathname) && process.env.NODE_ENV === 'production') {
      return withCors(jsonFail(ApiCode.NOT_FOUND, 'Not Found'), requestId);
    }

    // Info: (20250910 - Tzuhan) 其它（auth/service/admin）交給各 route 自己用 requireDeWT 驗章
    return withCors(NextResponse.next({ request: { headers: nextHeaders } }), requestId);
  }

  // Info: (20250910 - Tzuhan) 非 API 交給 i18nRouter
  return i18nRouter(req, i18nConfig);
}

export const config = {
  matcher: ['/api/:path*', '/((?!api|static|.*\\..*|_next).*)'],
};
