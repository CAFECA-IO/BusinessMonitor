import { NextRequest } from 'next/server';
import { jsonOk, jsonFail, ok, fail } from '@/lib/response';
import { ApiCode, HTTP_MAP } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import { companyIdParamSchema, pageQuerySchema, politicalResponseSchema } from '@/validators';
import { listPoliticalDonations } from '@/services/company.operations.service';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = companyIdParamSchema.parse(ctx.params);

    const url = new URL(req.url);
    const { page, pageSize } = pageQuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
    });

    const payload = await listPoliticalDonations(id, page, pageSize);

    politicalResponseSchema.parse(ok(payload));

    const res = jsonOk(payload, 'OK');
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
