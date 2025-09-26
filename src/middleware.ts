import { NextRequest } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import { i18nConfig } from 'i18n-config';
import { apiMiddleware } from '@/lib/middlewares/api'; // Info: (20250925 - Tzuhan) 引入新的 API 中介軟體

/**
 * Info: (20250925 - Tzuhan)
 * 這是專案的根中介軟體，職責非常單純：
 * 1. 如果是 API 請求，交給 `apiMiddleware` 處理。
 * 2. 如果是前端頁面請求，交給 `i18nRouter` 處理國際化。
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Info: (20250925 - Tzuhan) 【第二步】根據路徑分派請求
  if (pathname.startsWith('/api')) {
    return apiMiddleware(req);
  }

  // Info: (20250925 - Tzuhan) 非 API 請求，處理 i18n
  return i18nRouter(req, i18nConfig);
}

// Info: (20250925 - Tzuhan) Matcher 維持不變，攔截所有需要的請求
export const config = {
  matcher: ['/api/v1/:path*', '/((?!api|static|.*\\..*|_next).*)'],
};
