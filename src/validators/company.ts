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

/* Info: (20250814 - Tzuhan) ========== 卡片用型別 ========== */
export const isoDateTimeStringSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    'Must be ISO-8601 datetime (e.g., 2025-08-14T02:34:56Z)'
  );

export const trendPointSchema = z.object({
  date: isoDateTimeStringSchema,
  close: decimalStringSchema,
});
export type TrendPoint = z.infer<typeof trendPointSchema>;

export const flagsSchema = z.object({
  green: z.number().int().nonnegative(),
  red: z.number().int().nonnegative(),
});

export const marketSchema = z.object({
  last: decimalStringSchema.nullable(), // Info: (20250814 - Tzuhan) 最新收盤
  change: decimalStringSchema.nullable(), // Info: (20250814 - Tzuhan) 與前一筆差額
  changePct: decimalStringSchema.nullable(), // Info: (20250814 - Tzuhan) 漲跌幅（百分比數字，不含 %）
  sparkline: z.array(trendPointSchema).max(30),
});

export const companyCardSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  registrationNo: z.string(),
  logoUrl: z.string().nullable(),
  status: z.string().nullable(),
  foreignCompanyName: z.string().nullable(),
  address: z.string().nullable(),
  flags: flagsSchema,
  market: marketSchema,
});
export type CompanyCard = z.infer<typeof companyCardSchema>;

/* Info: (20250814 - Tzuhan) ========== 查詢參數 ========== */
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

export const companyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type CompanyIdParam = z.infer<typeof companyIdParamSchema>;

export const autocompleteQuerySchema = z.object({
  q: z.string(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;

export const newCompaniesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type NewCompaniesQuery = z.infer<typeof newCompaniesQuerySchema>;

export const newCompaniesResponseSchema = apiResponseSchema(z.array(companyCardSchema));
export type NewCompaniesResponse = z.infer<typeof newCompaniesResponseSchema>;

export const mostViewedCompaniesResponseSchema = apiResponseSchema(z.array(companyCardSchema));
export type MostViewedCompaniesResponse = z.infer<typeof mostViewedCompaniesResponseSchema>;
