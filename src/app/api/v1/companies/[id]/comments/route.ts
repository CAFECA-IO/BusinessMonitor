import { NextRequest } from 'next/server';
import { jsonOk, jsonFail, ok } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import { companyIdParamSchema } from '@/validators';
import { pageQuerySchema } from '@/validators/common';
import { companyCommentsResponseSchema } from '@/validators';
import { getCompanyComments } from '@/services/company.detail.service';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = companyIdParamSchema.parse(ctx.params);

    const url = new URL(req.url);
    const { page, pageSize } = pageQuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
    });

    const payload = await getCompanyComments(id, page, pageSize);

    companyCommentsResponseSchema.parse(ok(payload));

    const res = jsonOk(payload, 'OK');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    if (err instanceof ZodError) {
      return jsonFail(ApiCode.VALIDATION_ERROR, err.issues.map((i) => i.message).join('; '));
    }
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    return jsonFail(ApiCode.SERVER_ERROR, err instanceof Error ? err.message : 'Unexpected error');
  }
}
