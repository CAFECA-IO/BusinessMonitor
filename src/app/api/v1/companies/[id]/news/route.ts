import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { listCompanyNews } from '@/services/news.service';
import { CompanyNewsQuerySchema } from '@/validators/news';
import { withCompanyView } from '@/lib/with_company_view';

const ParamsSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const GET = withCompanyView(async (req: NextRequest, context: { params: unknown }) => {
  try {
    const { id } = ParamsSchema.parse(context.params);
    const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
    // Info: (20250821 - Tzuhan) 取重複 key：source
    const sourceMulti = req.nextUrl.searchParams.getAll('source');
    const parsed = CompanyNewsQuerySchema.safeParse({
      ...sp,
      source: sourceMulti.length ? sourceMulti : sp.source,
    });

    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('; ');
      return jsonFail(ApiCode.VALIDATION_ERROR, msg);
    }

    const { q, from, to, page, pageSize, sort, lang, source } = parsed.data;
    const payload = await listCompanyNews(id, q, from, to, page, pageSize, sort, lang, source);
    return jsonOk(payload);
  } catch (err) {
    // Info: (20250821 - Tzuhan) from > to 等業務錯誤 → 400；其他 → 500
    const msg = err instanceof Error ? err.message : 'Internal error';
    const code = /from must be <= to|Invalid date|Invalid/.test(msg)
      ? ApiCode.VALIDATION_ERROR
      : ApiCode.SERVER_ERROR;
    return jsonFail(code, msg);
  }
});
