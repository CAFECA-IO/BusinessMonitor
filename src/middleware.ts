import { i18nRouter } from 'next-i18n-router';
import { i18nConfig } from '@/../i18n-config';
import { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return i18nRouter(request, i18nConfig);
}

// Info: (20250807 - Julian) 只在 app 目錄下的路徑使用此 middleware
export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
};
