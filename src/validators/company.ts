import { z } from 'zod';
import {
  decimalStringSchema,
  bigIntStringSchema,
  jsonValueSchema,
  apiResponseSchema,
  paginationSchema,
  pageQuerySchema,
  isoDateTimeStringSchema,
} from '@/validators/common';

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
 * ================================================================= */

const trendPointSchema = z.object({
  date: isoDateTimeStringSchema,
  close: decimalStringSchema,
});
export type TrendPoint = z.infer<typeof trendPointSchema>;

const flagsSchema = z.object({
  green: z.number().int().nonnegative(),
  red: z.number().int().nonnegative(),
});

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
  market: marketSummarySchema,
});
export type CompanyCard = z.infer<typeof companyCardSchema>;

/* =================================================================
 * Info: (20251002 - Tzuhan) Market API (/companies/:id/market) - 最終版
 * ================================================================= */

export const companyMarketQuerySchema = z
  .object({
    timeframe: z
      .enum(['1d', '1w', '1m', '3m', '6m', '1y', 'ytd', 'all'], {
        message: "timeframe 參數僅接受 '1d', '1w', '1m', '3m', '6m', '1y', 'ytd', 'all'",
      })
      .optional(),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式需為 YYYY-MM-DD')
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式需為 YYYY-MM-DD')
      .optional(),
  })
  .refine((data) => !(data.timeframe && (data.from || data.to)), {
    message: 'timeframe 參數不可與 from/to 參數同時使用',
    path: ['timeframe'],
  })
  .refine((data) => (data.from && data.to) || (!data.from && !data.to), {
    message: 'from 和 to 參數必須同時提供',
    path: ['from'],
  });

export type CompanyMarketQuery = z.infer<typeof companyMarketQuerySchema>;
export type Timeframe = z.infer<typeof companyMarketQuerySchema.shape.timeframe>;

const marketDataPointSchema = z.object({
  date: isoDateTimeStringSchema,
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: bigIntStringSchema,
});

const marketDataPayloadSchema = z.object({
  companyId: z.number(),
  stockSymbol: z.string(),
  timeframe: z.enum(['1d', '1w', '1m', '3m', '6m', '1y', 'ytd', 'all', 'custom']),
  data: z.array(marketDataPointSchema),
});
export type MarketDataPayload = z.infer<typeof marketDataPayloadSchema>;

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
