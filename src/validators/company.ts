import { z } from 'zod';
import {
  DecimalString,
  BigIntString,
  JsonValue,
  ApiResponseSchema,
  PaginationSchema,
} from '@/validators/common';

/* Info: (20250814 - Tzuhan) ========== 基本 Company ========== */
export const CompanySchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  registrationNo: z.string().min(1),
  parentRegNo: z.string().optional(),
  representative: z.string().optional(),
  registrationCountry: z.string().optional(),
  establishedDate: z.string().optional(),
  capitalAmount: DecimalString.optional(),
  paidInCapital: DecimalString.optional(),
  capitalRanking: z.number().int().optional(),
  address: z.string().optional(),
  websiteUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  registrationAgency: z.string().optional(),
  status: z.string().optional(),
  organizationType: z.string().optional(),
  businessItems: JsonValue.optional(),
  contributions: JsonValue.optional(),
  shareholdingStatus: z.string().optional(),
  sharePrice: DecimalString.optional(),
  totalIssuedShares: BigIntString.optional(),
  multipleVotingRights: z.string().optional(),
  specialVotingRights: z.string().optional(),
  lastChangeDate: z.string().optional(),
  lastApprovedChange: z.string().optional(),
  statusDate: z.string().optional(),
  statusDocNo: z.string().optional(),
  foreignCompanyName: z.string().optional(),
  directors: JsonValue.optional(),
  managers: JsonValue.optional(),
  suspensionStartDate: z.string().optional(),
  suspensionEndDate: z.string().optional(),
  suspensionAgency: z.string().optional(),
  oldBusinessItemsUrl: z.string().optional(),
});
export type Company = z.infer<typeof CompanySchema>;

/* Info: (20250814 - Tzuhan) ========== 卡片用型別 ========== */
export const ISODateTimeString = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    'Must be ISO-8601 datetime (e.g., 2025-08-14T02:34:56Z)'
  );

export const TrendPointSchema = z.object({
  date: ISODateTimeString,
  close: DecimalString,
});
export type TrendPoint = z.infer<typeof TrendPointSchema>;

export const FlagsSchema = z.object({
  green: z.number().int().nonnegative(),
  red: z.number().int().nonnegative(),
});

export const MarketSchema = z.object({
  last: DecimalString.nullable(), // Info: (20250814 - Tzuhan) 最新收盤
  change: DecimalString.nullable(), // Info: (20250814 - Tzuhan) 與前一筆差額
  changePct: DecimalString.nullable(), // Info: (20250814 - Tzuhan) 漲跌幅（百分比數字，不含 %）
  sparkline: z.array(TrendPointSchema).max(30),
});

export const CompanyCardSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  registrationNo: z.string(),
  logoUrl: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  foreignCompanyName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  flags: FlagsSchema,
  market: MarketSchema,
});
export type CompanyCard = z.infer<typeof CompanyCardSchema>;

/* Info: (20250814 - Tzuhan) ========== 查詢參數 ========== */
export const CompaniesSearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'q is required'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type CompaniesSearchQuery = z.infer<typeof CompaniesSearchQuerySchema>;

export const PaginatedCompanyCardSchema = z
  .object({ items: z.array(CompanyCardSchema) })
  .and(PaginationSchema);

export type CompaniesSearchPayload = z.infer<typeof PaginatedCompanyCardSchema>;

export const CompaniesSearchResponseSchema = ApiResponseSchema(PaginatedCompanyCardSchema);
export type CompaniesSearchResponse = z.infer<typeof CompaniesSearchResponseSchema>;

export type AutocompleteQuery = {
  q: string;
  limit?: number; // Info: (20250814 - Tzuhan) 預設 10，最大 20
};
