import { NextRequest } from 'next/server';
import { jsonOk, jsonFail, ok, fail } from '@/lib/response';
import { ApiCode, HTTP_MAP } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import {
  companyIdParamSchema,
  announcementsQuerySchema,
  announcementsResponseSchema,
} from '@/validators';
import { listCompanyAnnouncements } from '@/services/company.announcements.service';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = companyIdParamSchema.parse(ctx.params);
    const url = new URL(req.url);
    const { limit } = announcementsQuerySchema.parse({
      limit: url.searchParams.get('limit') ?? undefined,
    });

    const items = await listCompanyAnnouncements(id, limit ?? 10);

    // Info: (20250902 - Tzuhan) dev 防呆
    announcementsResponseSchema.parse(ok(items));

    const res = jsonOk(items, 'OK');
    res.headers.set('Cache-Control', 's-maxage=300');
    return res;
  } catch (err) {
    if (err instanceof ZodError) {
      const body = fail(ApiCode.VALIDATION_ERROR, err.issues.map((i) => i.message).join('; '));
      return new Response(JSON.stringify(body), {
        status: HTTP_MAP[ApiCode.VALIDATION_ERROR],
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    return jsonFail(ApiCode.SERVER_ERROR, err instanceof Error ? err.message : 'Unexpected error');
  }
}
