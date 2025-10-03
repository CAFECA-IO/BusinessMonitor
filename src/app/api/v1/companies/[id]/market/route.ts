import { NextRequest } from 'next/server';
import { jsonOk, jsonFail, ok } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import {
  companyIdParamSchema,
  companyMarketQuerySchema,
  companyMarketResponseSchema,
  Timeframe,
  type CompanyMarketQuery,
} from '@/validators';
import { getCompanyMarketData } from '@/services/company.detail.service';
import { withCompanyView } from '@/lib/with_company_view';
import { loggerFromRequest } from '@/lib/logger';

type Ctx = { params: { id: string } };

export const GET = withCompanyView(async (req: NextRequest, ctx: Ctx) => {
  const logger = loggerFromRequest(req);
  try {
    // Info: (20251002 - Tzuhan) 1. 驗證公司 ID
    const { id } = companyIdParamSchema.parse(ctx.params);
    const url = new URL(req.url);

    // Info: (20251002 - Tzuhan) 2. 解析並驗證查詢參數
    const queryParams: CompanyMarketQuery = {
      timeframe: (url.searchParams.get('timeframe') as Timeframe) ?? undefined,
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
    };
    const query = companyMarketQuerySchema.parse(queryParams);

    // Info: (20251002 - Tzuhan) 3. 呼叫服務層獲取資料
    logger.info(`Fetching market data`, { companyId: id, query });
    const payload = await getCompanyMarketData(id, query);

    // Info: (20251002 - Tzuhan) 4. 在開發環境下，額外驗證回應 payload
    if (process.env.NODE_ENV === 'development') {
      companyMarketResponseSchema.parse(ok(payload));
    }

    // Info: (20251002 - Tzuhan) 5. 回傳成功的回應並設定快取
    const res = jsonOk(payload);
    res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res;
  } catch (err) {
    // Info: (20251002 - Tzuhan) 6. 錯誤處理
    if (err instanceof AppError) {
      logger.warn(err.message, { code: err.code });
      return jsonFail(err.code, err.message);
    }
    if (err instanceof ZodError) {
      const errorMessage = err.issues.map((issue) => issue.message).join(', ');
      logger.warn('Validation failed', { errors: JSON.stringify(err.issues) });
      return jsonFail(ApiCode.VALIDATION_ERROR, errorMessage);
    }
    logger.error('An unexpected error occurred in market route', {
      error: (err as Error).stack || JSON.stringify(err),
    });
    return jsonFail(ApiCode.SERVER_ERROR, '發生未預期的錯誤');
  }
});
