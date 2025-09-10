import { NextRequest, NextResponse } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import { i18nConfig } from 'i18n-config';
import { fail } from '@/lib/response';
import { ApiCode } from '@/lib/status';

const API_PREFIX = '/api/';
const PUBLIC_API_PATHS: (string | RegExp)[] = [
  '/api/health',
  /^\/api\/v1\/public(\/.*)?$/,
  /^\/api\/auth(\/.*)?$/,
];

const PUBLIC_GET_PATHS: RegExp[] = [
  /^\/api\/v1\/companies\/\d+\/basic$/,
  /^\/api\/v1\/companies\/\d+\/view$/,
  /^\/api\/v1\/companies\/\d+\/market$/,
  /^\/api\/v1\/companies\/\d+\/news$/,
  /^\/api\/v1\/companies\/\d+\/flags$/,
  /^\/api\/v1\/companies\/\d+\/comments$/,
  /^\/api\/v1\/companies\/\d+\/announcements$/,
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

  if (ALLOW_ORIGIN !== '*') res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Vary', 'Origin');
  if (requestId) res.headers.set('x-request-id', requestId);
  return res;
}

function hasSessionCookie(req: NextRequest): boolean {
  return Boolean(req.cookies.get('bm_sess')?.value);
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

    if (isPublicApi(pathname) || (req.method === 'GET' && isPublicGet(pathname))) {
      return withCors(NextResponse.next({ request: { headers: nextHeaders } }), requestId);
    }

    // Info: (20250909 - Tzuhan) 只接受 Cookie
    if (!hasSessionCookie(req)) {
      return withCors(
        NextResponse.json(fail(ApiCode.UNAUTHENTICATED, 'Missing session cookie'), { status: 401 }),
        requestId
      );
    }

    return withCors(NextResponse.next({ request: { headers: nextHeaders } }), requestId);
  }

  return i18nRouter(req, i18nConfig);
}
