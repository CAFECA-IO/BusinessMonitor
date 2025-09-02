import { NextRequest } from 'next/server';
import { jsonOk, jsonFail, ok, fail } from '@/lib/response';
import { ApiCode, HttpMap } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import {
  CompanyIdParam,
  AnnouncementsQuerySchema,
  AnnouncementsResponseSchema,
} from '@/validators';
import { listCompanyAnnouncements } from '@/services/company.announcements.service';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = CompanyIdParam.parse(ctx.params);
    const url = new URL(req.url);
    const { limit } = AnnouncementsQuerySchema.parse({
      limit: url.searchParams.get('limit') ?? undefined,
    });

    const items = await listCompanyAnnouncements(id, limit ?? 10);

    // dev 防呆
    AnnouncementsResponseSchema.parse(ok(items));

    const res = jsonOk(items, 'OK');
    res.headers.set('Cache-Control', 's-maxage=300');
    return res;
  } catch (err) {
    if (err instanceof ZodError) {
      const body = fail(ApiCode.VALIDATION_ERROR, err.issues.map((i) => i.message).join('; '));
      return new Response(JSON.stringify(body), {
        status: HttpMap[ApiCode.VALIDATION_ERROR],
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    return jsonFail(ApiCode.SERVER_ERROR, err instanceof Error ? err.message : 'Unexpected error');
  }
}
