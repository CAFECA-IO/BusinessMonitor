import { z } from 'zod';
import { ApiResponseSchema, DecimalString } from '@/validators/common';
import { TrendPointSchema as BaseTrendPoint } from '@/validators/company';

/** 市場區段 */
export const MarketRange = z.enum(['7d', '1m', '3m', '6m', '1y']);
export type MarketRange = z.infer<typeof MarketRange>;

/** 市場查詢參數 */
export const CompanyMarketQuery = z.object({
  range: MarketRange.default('3m'),
  /** 覆蓋預設點數（會在 route 內 clamp 10..365） */
  limit: z.coerce.number().int().min(10).max(365).optional(),
});
export type CompanyMarketQuery = z.infer<typeof CompanyMarketQuery>;

/** 允許更長的 sparkline（最多 365 點） */
export const TrendPointLongSchema = BaseTrendPoint; // date + close(DecimalString)
export const MarketDetailSchema = z.object({
  last: DecimalString.nullable(),
  change: DecimalString.nullable(),
  changePct: DecimalString.nullable(),
  sparkline: z.array(TrendPointLongSchema).max(365),
});
export type MarketDetail = z.infer<typeof MarketDetailSchema>;

export const CompanyMarketResponseSchema = ApiResponseSchema(MarketDetailSchema);
export type CompanyMarketResponse = z.infer<typeof CompanyMarketResponseSchema>;
