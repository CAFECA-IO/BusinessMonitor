import { z } from 'zod';
import { ApiResponseSchema, DecimalString, PaginatedOf } from '@/validators';

/** Info: (20250822 - Tzuhan) 政府標案列 */
export const TenderRowSchema = z.object({
  projectTitle: z.string(),
  agencyName: z.string().nullable(),
  awardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  awardAmount: DecimalString.nullable(),
  awarded: z.boolean(),
});
export type TenderRow = z.infer<typeof TenderRowSchema>;

export const PaginatedTenderSchema = PaginatedOf(TenderRowSchema);
export type PaginatedTender = z.infer<typeof PaginatedTenderSchema>;

export const TenderResponse = ApiResponseSchema(PaginatedTenderSchema);
export type TenderResponse = z.infer<typeof TenderResponse>;

/** Info: (20250822 - Tzuhan) 商標列（applicationNo/status 目前資料庫無，先保留為可選以利擴充） */
export const TrademarkRowSchema = z.object({
  name: z.string(),
  imageUrl: z.url().nullable().optional(),
  description: z.string().nullable().optional(),
  applicationNo: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});
export type TrademarkRow = z.infer<typeof TrademarkRowSchema>;

export const PaginatedTrademarkSchema = PaginatedOf(TrademarkRowSchema);
export type PaginatedTrademark = z.infer<typeof PaginatedTrademarkSchema>;

export const TrademarkResponse = ApiResponseSchema(PaginatedTrademarkSchema);
export type TrademarkResponse = z.infer<typeof TrademarkResponse>;

/** Info: (20250825 - Tzuhan) ==== Patent ==== */
export const PatentRowSchema = z.object({
  title: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Info: (20250825 - Tzuhan) YYYY-MM-DD
  applicationNo: z.string().nullable().optional(),
  kind: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
export type PatentRow = z.infer<typeof PatentRowSchema>;

export const PaginatedPatentSchema = PaginatedOf(PatentRowSchema);
export type PaginatedPatent = z.infer<typeof PaginatedPatentSchema>;

export const PatentResponse = ApiResponseSchema(PaginatedPatentSchema);
export type PatentResponse = z.infer<typeof PatentResponse>;

/** Info: (20250826 - Tzuhan) =============== Trade (進出口彙總) =============== */
export const TradeRowSchema = z.object({
  year: z.number().int(),
  month: z.string().regex(/^\d{4}-\d{2}$/), // Info: (20250826 - Tzuhan) 例如 2025-03；若原始資料無月，回傳 YYYY-00
  totalImportUSD: DecimalString, // Info: (20250826 - Tzuhan) 以字串回傳
  totalExportUSD: DecimalString, // Info: (20250826 - Tzuhan) 以字串回傳
});
export type TradeRow = z.infer<typeof TradeRowSchema>;

export const PaginatedTradeSchema = PaginatedOf(TradeRowSchema);
export type PaginatedTrade = z.infer<typeof PaginatedTradeSchema>;

// Info: (20250826 - Tzuhan) /companies/:id/operations/trade 查詢參數
export const TradeQuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type TradeQuery = z.infer<typeof TradeQuerySchema>;

export const TradeResponse = ApiResponseSchema(PaginatedTradeSchema);
export type TradeResponse = z.infer<typeof TradeResponse>;

/** Info: (20250826 - Tzuhan) =============== Political activities (donations/contributions) =============== */
export const PoliticalRowSchema = z.object({
  event: z.string(),
  amount: DecimalString, // Info: (20250826 - Tzuhan) 金額字串
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Info: (20250826 - Tzuhan) YYYY-MM-DD
  recipient: z.string().optional(),
});
export type PoliticalRow = z.infer<typeof PoliticalRowSchema>;

export const PaginatedPoliticalSchema = PaginatedOf(PoliticalRowSchema);
export type PaginatedPolitical = z.infer<typeof PaginatedPoliticalSchema>;

export const PoliticalResponse = ApiResponseSchema(PaginatedPoliticalSchema);
export type PoliticalResponse = z.infer<typeof PoliticalResponse>;
