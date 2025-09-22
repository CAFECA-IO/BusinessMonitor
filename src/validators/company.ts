import { z } from 'zod';
import {
  decimalStringSchema,
  bigIntStringSchema,
  jsonValueSchema,
  apiResponseSchema,
  paginationSchema,
  pageQuerySchema,
} from '@/validators';

/* Info: (20250814 - Tzuhan) ========== 基本 Company ========== */
export const companySchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  registrationNo: z.string().min(1),
  parentRegNo: z.string().optional(),
  representative: z.string().optional(),
  registrationCountry: z.string().optional(),
  establishedDate: z.string().optional(),
  capitalAmount: decimalStringSchema.optional(),
  paidInCapital: decimalStringSchema.optional(),
  capitalRanking: z.number().int().optional(),
  address: z.string().optional(),
  websiteUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  registrationAgency: z.string().optional(),
  status: z.string().optional(),
  organizationType: z.string().optional(),
  businessItems: jsonValueSchema.optional(),
  contributions: jsonValueSchema.optional(),
  shareholdingStatus: z.string().optional(),
  sharePrice: decimalStringSchema.optional(),
  totalIssuedShares: bigIntStringSchema.optional(),
  multipleVotingRights: z.string().optional(),
  specialVotingRights: z.string().optional(),
  lastChangeDate: z.string().optional(),
  lastApprovedChange: z.string().optional(),
  statusDate: z.string().optional(),
  statusDocNo: z.string().optional(),
  foreignCompanyName: z.string().optional(),
  directors: jsonValueSchema.optional(),
  managers: jsonValueSchema.optional(),
  suspensionStartDate: z.string().optional(),
  suspensionEndDate: z.string().optional(),
  suspensionAgency: z.string().optional(),
  oldBusinessItemsUrl: z.string().optional(),
});
export type Company = z.infer<typeof companySchema>;

export const companyIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Company ID 必須為正整數'),
});
export type CompanyIdParam = z.infer<typeof companyIdParamSchema>;

/* =================================================================
 * Info: (20250922 - Tzuhan) 公司列表卡片 (Company Card) 相關結構
 * Note: 這部分的 marketSchema 是用於卡片上的「摘要」圖表，應予保留。
 * ================================================================= */

const isoDateTimeStringSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    'Must be ISO-8601 datetime (e.g., 2025-08-14T02:34:56Z)'
  );

const trendPointSchema = z.object({
  date: isoDateTimeStringSchema,
  close: decimalStringSchema,
});
export type TrendPoint = z.infer<typeof trendPointSchema>;

const flagsSchema = z.object({
  green: z.number().int().nonnegative(),
  red: z.number().int().nonnegative(),
});

// Info: (20250922 - Tzuhan) 此 marketSchema 為列表卡片上的「摘要」版本，與 market detail API 的 payload 不同。
const marketSummarySchema = z.object({
  last: decimalStringSchema.nullable(),
  change: decimalStringSchema.nullable(),
  changePct: decimalStringSchema.nullable(),
  sparkline: z.array(trendPointSchema).max(30),
});

export const companyCardSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  registrationNo: z.string(),
  logoUrl: z.string().nullable(),
  status: z.string().nullable(),
  address: z.string().nullable(),
  foreignCompanyName: z.string().nullable(),
  flags: flagsSchema,
  market: marketSummarySchema, // Info: (20250922 - Tzuhan) 使用摘要版的 market schema
});
export type CompanyCard = z.infer<typeof companyCardSchema>;

/* =================================================================
 * Info: (20250922 - Tzuhan) : Market API (/companies/:id/market)
 * Note: 這是本次重構的核心，用來取代舊的 mock data 結構。
 * ================================================================= */

// Info: (20250922 - Tzuhan) Market API 查詢參數 (Query)
export const companyMarketQuerySchema = z.object({
  timeframe: z
    .enum(['daily', 'weekly', 'monthly'], {
      message: "timeframe 參數僅接受 'daily', 'weekly', 'monthly'",
    })
    .default('daily'),
});
export type CompanyMarketQuery = z.infer<typeof companyMarketQuerySchema>;
export type Timeframe = z.infer<typeof companyMarketQuerySchema.shape.timeframe>;

// Info: (20250922 - Tzuhan)  Market API 回應 (Response) 的 Payload 結構
const marketDataPointSchema = z.object({
  date: isoDateTimeStringSchema, // Info: (20250922 - Tzuhan)  YYYY-MM-DDTHH:mm:ss.sssZ
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: bigIntStringSchema, // Info: (20250922 - Tzuhan)  使用字串以避免 BigInt 精度問題
});

const marketDataPayloadSchema = z.object({
  companyId: z.number(),
  stockSymbol: z.string(),
  timeframe: z.string(),
  data: z.array(marketDataPointSchema),
});
export type MarketDataPayload = z.infer<typeof marketDataPayloadSchema>;

// Info: (20250922 - Tzuhan) Market API 最終的完整 Response 結構
export const companyMarketResponseSchema = apiResponseSchema(marketDataPayloadSchema);
export type CompanyMarketResponse = z.infer<typeof companyMarketResponseSchema>;

// Info: (20250922 - Tzuhan) --- 搜尋 API ---
export const companiesSearchQuerySchema = z
  .object({ q: z.string().trim().min(1, 'q is required') })
  .merge(pageQuerySchema);
export type CompaniesSearchQuery = z.infer<typeof companiesSearchQuerySchema>;

export const paginatedCompanyCardSchema = z
  .object({ items: z.array(companyCardSchema) })
  .and(paginationSchema);
export type CompaniesSearchPayload = z.infer<typeof paginatedCompanyCardSchema>;

export const companiesSearchResponseSchema = apiResponseSchema(paginatedCompanyCardSchema);
export type CompaniesSearchResponse = z.infer<typeof companiesSearchResponseSchema>;

// Info: (20250922 - Tzuhan)  --- Autocomplete API ---
export const autocompleteQuerySchema = z.object({
  q: z.string(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;

// Info: (20250922 - Tzuhan) --- 新公司/熱門公司 API ---
export const newCompaniesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type NewCompaniesQuery = z.infer<typeof newCompaniesQuerySchema>;

export const newCompaniesResponseSchema = apiResponseSchema(z.array(companyCardSchema));
export type NewCompaniesResponse = z.infer<typeof newCompaniesResponseSchema>;

export const mostViewedCompaniesResponseSchema = apiResponseSchema(z.array(companyCardSchema));
export type MostViewedCompaniesResponse = z.infer<typeof mostViewedCompaniesResponseSchema>;

/* =================================================================
 * Info: (20250922 - Tzuhan) [舊版/待移除]
 * Note: 以下 trendPointSchema 和 marketSchema 是舊版的定義，
 * 它們的功能已被上面新的 marketData... schemas 取代或整合。
 * 確認前端與其他地方不再使用後即可刪除。
 * ================================================================= */

// [標註為待移除] - 已被 Market API 新結構中的 marketDataPointSchema 取代
/*
export const trendPointSchema = z.object({
  date: isoDateTimeStringSchema,
  close: decimalStringSchema,
});
*/

// [標註為待移除] - 已被 Market API 新結構中的 marketDataPayloadSchema 取代
/*
export const marketSchema = z.object({
  last: decimalStringSchema.nullable(),
  change: decimalStringSchema.nullable(),
  changePct: decimalStringSchema.nullable(),
  sparkline: z.array(trendPointSchema).max(30),
});
*/
