import { NextRequest } from 'next/server';
import { jsonOk, jsonFail, ok } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import {
  companyIdParamSchema,
  companyMarketQuerySchema,
  companyMarketResponseSchema,
} from '@/validators';
import { getCompanyMarketData } from '@/services/company.detail.service';
import { withCompanyView } from '@/lib/with_company_view';
import { loggerFromRequest } from '@/lib/logger';

type Ctx = { params: { id: string } };

export const GET = withCompanyView(async (req: NextRequest, ctx: Ctx) => {
  const logger = loggerFromRequest(req);
  try {
    const { id } = companyIdParamSchema.parse(ctx.params);
    const url = new URL(req.url);

    const { timeframe, startDate, endDate, period } = companyMarketQuerySchema.parse({
      timeframe: url.searchParams.get('timeframe') ?? undefined,
      startDate: url.searchParams.get('startDate') ?? undefined,
      endDate: url.searchParams.get('endDate') ?? undefined,
      period: url.searchParams.get('period') ?? undefined,
    });

    logger.info(`Fetching market data`, { companyId: id, timeframe });
    const payload = await getCompanyMarketData(id, {
      timeframe,
      startDate,
      endDate,
      period,
    });

    if (process.env.NODE_ENV === 'development') {
      companyMarketResponseSchema.parse(ok(payload));
    }

    const res = jsonOk(payload);
    res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res;
  } catch (err) {
    if (err instanceof AppError) {
      logger.warn(err.message, { code: err.code });
      return jsonFail(err.code, err.message);
    }
    if (err instanceof ZodError) {
      logger.warn('Validation failed', { errors: JSON.stringify(err.issues) });
      return jsonFail(ApiCode.VALIDATION_ERROR, err.issues[0]?.message ?? '參數驗證失敗');
    }
    logger.error('An unexpected error occurred in market route', {
      error: (err as Error).stack || JSON.stringify(err),
    });
    return jsonFail(ApiCode.SERVER_ERROR, '發生未預期的錯誤');
  }
});
