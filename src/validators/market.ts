import { z } from 'zod';
import {
  apiResponseSchema,
  decimalStringSchema,
  trendPointSchema as BaseTrendPoint,
} from '@/validators';

// Info: (20250820 - Tzuhan) 市場區段
export const MARKET_RANGES = ['7d', '1m', '3m', '6m', '1y'] as const;
export const marketRangeSchema = z.enum(MARKET_RANGES);
export type MarketRange = z.infer<typeof marketRangeSchema>;

// Info: (20250820 - Tzuhan) 市場查詢參數
export const companyMarketQuerySchema = z.object({
  range: marketRangeSchema.default('3m'),
  // Info: (20250820 - Tzuhan) 覆蓋預設點數（會在 route 內 clamp 10..365）
  limit: z.coerce.number().int().min(10).max(365).optional(),
});
export type CompanyMarketQuery = z.infer<typeof companyMarketQuerySchema>;

// Info: (20250820 - Tzuhan) 允許更長的 sparkline（最多 365 點）
export const trendPointLongSchema = BaseTrendPoint; // Info: (20250820 - Tzuhan) date + close(decimalStringSchema)
export const marketDetailSchema = z.object({
  last: decimalStringSchema.nullable(),
  change: decimalStringSchema.nullable(),
  changePct: decimalStringSchema.nullable(),
  sparkline: z.array(trendPointLongSchema).max(365),
});
export type MarketDetail = z.infer<typeof marketDetailSchema>;

export const companyMarketResponseSchema = apiResponseSchema(marketDetailSchema);
export type CompanyMarketResponse = z.infer<typeof companyMarketResponseSchema>;
