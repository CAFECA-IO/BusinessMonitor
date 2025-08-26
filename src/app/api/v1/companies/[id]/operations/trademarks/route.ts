import { NextRequest } from 'next/server';
import { jsonOk, jsonFail, ok } from '@/lib/response';
import { ApiCode, HttpMap } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import { CompanyIdParam } from '@/validators';
import { PageQuery } from '@/validators/common';
import { TrademarkResponse } from '@/validators/company.operations';
import { listTrademarks } from '@/services/company.operations.service';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = CompanyIdParam.parse(ctx.params);

    const url = new URL(req.url);
    const { page, pageSize } = PageQuery.parse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
    });

    const payload = await listTrademarks(id, page, pageSize);

    // Info: (20250822 - Tzuhan) 開發期型別防呆
    TrademarkResponse.parse(ok(payload));

    const res = jsonOk(payload, 'OK');
    res.headers.set('Cache-Control', 's-maxage=300');
    return res;
  } catch (err) {
    if (err instanceof ZodError) {
      return jsonFail(ApiCode.VALIDATION_ERROR, err.issues.map((i) => i.message).join('; '));
    }
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    return jsonFail(ApiCode.SERVER_ERROR, err instanceof Error ? err.message : 'Unexpected error');
  }
}
