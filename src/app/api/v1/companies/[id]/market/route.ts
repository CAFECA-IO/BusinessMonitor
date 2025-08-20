import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import { CompanyIdParam, CompanyMarketQuery, CompanyMarketResponseSchema } from '@/validators';
import { getCompanyMarket, marketLimitOf } from '@/services/company.detail.service';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = CompanyIdParam.parse(ctx.params);

    const url = new URL(req.url);
    const { range, limit } = CompanyMarketQuery.parse({
      range: url.searchParams.get('range') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    const effLimit = marketLimitOf(range ?? '3m', limit ?? undefined);
    const payload = await getCompanyMarket(id, effLimit);

    // dev 防呆（上線可移除）
    CompanyMarketResponseSchema.parse({
      powerby: 'BusinessMonitor api 1.0.0',
      success: true,
      code: 'OK',
      message: 'OK',
      payload,
    });

    const res = jsonOk(payload, 'OK');
    res.headers.set('Cache-Control', 's-maxage=30');
    return res;
  } catch (err) {
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    if (err instanceof ZodError) {
      return jsonFail(ApiCode.VALIDATION_ERROR, err.issues.map((i) => i.message).join('; '));
    }
    return jsonFail(ApiCode.SERVER_ERROR, err instanceof Error ? err.message : 'Unexpected error');
  }
}
