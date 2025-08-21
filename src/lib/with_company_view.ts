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
  const skipBots = opts?.skipBots ?? true;

  const BOT_RE =
    /(bot|crawler|spider|slurp|bingpreview|facebookexternalhit|ia_archiver|duckduckbot|yandex|ahrefs|semrush|applebot|twitterbot)/i;

  return async (req, ctx) => {
    const ua = req.headers.get('user-agent') ?? '';
    const trackHeader = req.headers.get('x-bm-track');
    const skipHeader = req.headers.get('x-bm-skip');

    // Info: (20250821 - Tzuhan) 1) 是否要追蹤
    const shouldTrack =
      trackHeader === '1' ||
      (trackHeader === null &&
        methods.includes(req.method as HttpMethod) &&
        /^\/api\/v1\/companies\/\d+\/(basic|market|news|comments)$/.test(
          new URL(req.url).pathname
        ));

    // Info: (20250821 - Tzuhan) 2) 是否要跳過（優先尊重 middleware，但仍做自保）
    let shouldSkip = skipHeader === 'bot';
    if (skipBots && !shouldSkip) shouldSkip = BOT_RE.test(ua);

    if (methods.includes(req.method as HttpMethod) && shouldTrack && !shouldSkip) {
      try {
        const { id } = CompanyIdParam.parse(ctx.params);
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
