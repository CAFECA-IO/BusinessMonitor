import { NextRequest } from 'next/server';
import { CompanyIdParam } from '@/validators';
import { clientIp, ipUaHash } from '@/lib/request';
import { recordCompanyView } from '@/services/company.view.service';

type CtxWithCompanyId = { params: { id: string } };
type HttpMethod = 'GET' | 'HEAD';
type Handler<C extends CtxWithCompanyId> = (req: NextRequest, ctx: C) => Promise<Response>;

export function withCompanyView<C extends CtxWithCompanyId>(
  handler: Handler<C>,
  opts?: {
    methods?: HttpMethod[]; // Info: (20250821 - Tzuhan) 預設只在 GET 記錄
    skipBots?: boolean; // Info: (20250821 - Tzuhan) 預設略過爬蟲
  }
): Handler<C> {
  const methods = opts?.methods ?? ['GET'];
  const BOT_RE =
    /(bot|crawler|spider|slurp|bingpreview|facebookexternalhit|ia_archiver|duckduckbot|yandex|ahrefs|semrush|applebot|twitterbot)/i;

  return async (req, ctx) => {
    const trackHeader = req.headers.get('x-bm-track');
    const skipHeader = req.headers.get('x-bm-skip');

    let shouldTrack = trackHeader === '1';
    let shouldSkip = skipHeader === 'bot';

    // fallback：沒經 middleware 時自行判斷
    if (trackHeader === null) {
      const pathname = new URL(req.url).pathname;
      shouldTrack =
        /^\/api\/v1\/companies\/\d+\/(basic|market|news|comments)$/.test(pathname) &&
        req.method === 'GET';
      const ua = req.headers.get('user-agent') ?? '';
      shouldSkip = BOT_RE.test(ua);
    }

    // Info: (20250821 - Tzuhan) 僅在指定方法且非爬蟲時記錄
    if (methods.includes(req.method as HttpMethod) && shouldTrack && !shouldSkip) {
      try {
        const { id } = CompanyIdParam.parse(ctx.params);
        const ua = req.headers.get('user-agent') ?? '';
        const ipHash = ipUaHash(clientIp(req), ua);
        const sessionId = req.headers.get('x-session-id') ?? req.cookies.get('sid')?.value;
        await recordCompanyView(id, ipHash, sessionId);
      } catch {
        // Info: (20250821 - Tzuhan) 統一吞掉，不影響主回應
      }
    }

    return handler(req, ctx);
  };
}
