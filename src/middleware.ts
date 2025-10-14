import { NextRequest, NextResponse } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import { i18nConfig } from 'i18n-config';
import { apiMiddleware } from '@/lib/middlewares/api';

const CANONICAL_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN;
const NODE_ENV = process.env.NODE_ENV;

export async function middleware(req: NextRequest) {
  // Info: (20251014 - Tzuhan) 只有在「生產環境」且「不是在 Jest 測試中」執行時，才啟用網域轉址。
  // Info: (20251014 - Tzuhan)  process.env.JEST_WORKER_ID 是 Jest 執行時會自動設定的環境變數。
  const isRunningInTest = process.env.IS_JEST_TEST === 'true';

  if (NODE_ENV === 'production' && !isRunningInTest && CANONICAL_ORIGIN) {
    const requestHost = req.headers.get('x-forwarded-host') ?? req.nextUrl.host;
    const canonicalHost = new URL(CANONICAL_ORIGIN).host;

    if (requestHost !== canonicalHost) {
      const newUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, CANONICAL_ORIGIN);
      return NextResponse.redirect(newUrl, 308);
    }
  }

  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api')) {
    return apiMiddleware(req);
  }

  return i18nRouter(req, i18nConfig);
}

export const config = {
  matcher: ['/api/v1/:path*', '/((?!api|static|.*\\..*|_next).*)'],
};
