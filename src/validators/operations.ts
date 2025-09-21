import { z } from 'zod';
import { apiResponseSchema, decimalStringSchema, paginatedOfSchema } from '@/validators';

/** Info: (20250822 - Tzuhan) 政府標案列 */
export const tenderRowSchema = z.object({
  projectTitle: z.string(),
  agencyName: z.string().nullable(),
  awardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  awardAmount: decimalStringSchema.nullable(),
  awarded: z.boolean(),
});
export type TenderRow = z.infer<typeof tenderRowSchema>;

export const paginatedTenderSchema = paginatedOfSchema(tenderRowSchema);
export type PaginatedTender = z.infer<typeof paginatedTenderSchema>;

export const tenderResponseSchema = apiResponseSchema(paginatedTenderSchema);
export type TenderResponse = z.infer<typeof tenderResponseSchema>;

/** Info: (20250822 - Tzuhan) 商標列（applicationNo/status 目前資料庫無，先保留為可選以利擴充） */
export const trademarkRowSchema = z.object({
  name: z.string(),
  imageUrl: z.url().nullable().optional(),
  description: z.string().nullable().optional(),
  applicationNo: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});
export type TrademarkRow = z.infer<typeof trademarkRowSchema>;

export const paginatedTrademarkSchema = paginatedOfSchema(trademarkRowSchema);
export type PaginatedTrademark = z.infer<typeof paginatedTrademarkSchema>;

export const trademarkResponseSchema = apiResponseSchema(paginatedTrademarkSchema);
export type TrademarkResponse = z.infer<typeof trademarkResponseSchema>;

/** Info: (20250825 - Tzuhan) ==== Patent ==== */
export const patentRowSchema = z.object({
  title: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Info: (20250825 - Tzuhan) YYYY-MM-DD
  applicationNo: z.string().nullable().optional(),
  kind: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
export type PatentRow = z.infer<typeof patentRowSchema>;

export const paginatedPatentSchema = paginatedOfSchema(patentRowSchema);
export type PaginatedPatent = z.infer<typeof paginatedPatentSchema>;

export const patentResponseSchema = apiResponseSchema(paginatedPatentSchema);
export type PatentResponse = z.infer<typeof patentResponseSchema>;

/** Info: (20250826 - Tzuhan) =============== Trade (進出口彙總) =============== */
export const tradeRowSchema = z.object({
  year: z.number().int(),
  month: z.string().regex(/^\d{4}-\d{2}$/), // Info: (20250826 - Tzuhan) 例如 2025-03；若原始資料無月，回傳 YYYY-00
  totalImportUSD: decimalStringSchema, // Info: (20250826 - Tzuhan) 以字串回傳
  totalExportUSD: decimalStringSchema, // Info: (20250826 - Tzuhan) 以字串回傳
});
export type TradeRow = z.infer<typeof tradeRowSchema>;

export const paginatedTradeSchema = paginatedOfSchema(tradeRowSchema);
export type PaginatedTrade = z.infer<typeof paginatedTradeSchema>;

// Info: (20250826 - Tzuhan) /companies/:id/operations/trade 查詢參數
export const tradeQuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type TradeQuery = z.infer<typeof tradeQuerySchema>;

export const tradeResponseSchema = apiResponseSchema(paginatedTradeSchema);
export type TradeResponse = z.infer<typeof tradeResponseSchema>;

/** Info: (20250826 - Tzuhan) =============== Political activities (donations/contributions) =============== */
export const politicalRowSchema = z.object({
  event: z.string(),
  amount: decimalStringSchema, // Info: (20250826 - Tzuhan) 金額字串
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Info: (20250826 - Tzuhan) YYYY-MM-DD
  recipient: z.string().optional(),
});
export type PoliticalRow = z.infer<typeof politicalRowSchema>;

export const paginatedPoliticalSchema = paginatedOfSchema(politicalRowSchema);
export type PaginatedPolitical = z.infer<typeof paginatedPoliticalSchema>;

export const politicalResponseSchema = apiResponseSchema(paginatedPoliticalSchema);
export type PoliticalResponse = z.infer<typeof politicalResponseSchema>;
