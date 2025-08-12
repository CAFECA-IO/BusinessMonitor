import { z } from 'zod';
import { DecimalString, BigIntString, JsonValue, ApiResponseSchema } from '@/validators/common';

export const CompanySchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  registrationNo: z.string().min(1),
  parentRegNo: z.string().optional(),
  representative: z.string().optional(),
  registrationCountry: z.string().optional(),
  establishedDate: z.string().optional(),
  capitalAmount: DecimalString.optional(), // Info: (20250808 - Tzuhan) Decimal(30,8) -> string
  paidInCapital: DecimalString.optional(), // Info: (20250808 - Tzuhan) Decimal(30,8) -> string
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
  totalIssuedShares: BigIntString.optional(), // Info: (20250808 - Tzuhan) BigInt -> string
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

  // Info: (20250808 - Tzuhan) 關聯不放進核心實體（避免循環 & 脫耦 DB 關聯）
});

export type Company = z.infer<typeof CompanySchema>;

// Info: (20250812 - Tzuhan) UI 走勢用到的點
export const TrendPointSchema = z.object({
  date: z.string().datetime(), // ISO-8601（UTC+0）
  close: DecimalString, // string: Decimal(30,8)
});

// Info: (20250812 - Tzuhan) 卡片：只放 UI 需要的欄位
export const CompanyCardSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  registrationNo: z.string(),
  logoUrl: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  foreignCompanyName: z.string().nullable().optional(),
  trend: z.array(TrendPointSchema).max(30), // 近 30 筆（倒序取、正序回前端）
  peRatio: DecimalString.nullable().optional(),
  marketCap: DecimalString.nullable().optional(),
});
export type CompanyCard = z.infer<typeof CompanyCardSchema>;

// Info: (20250812 - Tzuhan) 查詢參數：對齊規格「page/pageSize」
export const CompaniesSearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'q is required'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type CompaniesSearchQuery = z.infer<typeof CompaniesSearchQuerySchema>;

export const CompaniesSearchPayloadSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  items: z.array(CompanyCardSchema),
});
export type CompaniesSearchPayload = z.infer<typeof CompaniesSearchPayloadSchema>;

export const CompaniesSearchResponseSchema = ApiResponseSchema(CompaniesSearchPayloadSchema);
export type CompaniesSearchResponse = z.infer<typeof CompaniesSearchResponseSchema>;
