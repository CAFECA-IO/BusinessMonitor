import { z } from 'zod';
import { ApiResponseSchema, DecimalString, PaginatedOf } from '@/validators/common';

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
