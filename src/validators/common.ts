import { ApiCode } from '@/lib/status';
import { z } from 'zod';

export const DecimalString = z.string().regex(/^-?\d+(\.\d+)?$/, 'Decimal string expected'); // Info: (20250808 - Tzuhan) Prisma Decimal 建議走字串

export const BigIntString = z.string().regex(/^\d+$/, 'BigInt string expected');

export const JsonValue: z.ZodType<unknown> = z.unknown();

/* Info: (20250814 - Tzuhan) ========== 分頁容器（新） ========== */
export const SortOrderSchema = z.enum(['asc', 'desc']);
export const SortSpecSchema = z
  .array(z.object({ sortBy: z.string(), sortOrder: SortOrderSchema }))
  .optional();

/** Info: (20250821 - Tzuhan) 共用：將 ?source 支援「多值、多次、逗號分隔」 */
export const StringArrayParam = z
  .union([z.string().min(1), z.array(z.string().min(1))])
  .transform((v) => (Array.isArray(v) ? v : v.split(',').map((s) => s.trim())))
  .pipe(z.array(z.string().min(1)).max(20))
  .optional();

/** Info: (20250821 - Tzuhan) 共用：日期(YYYY-MM-DD 或 ISO)，轉成 Date */
export const DateParam = z
  .string()
  .transform((s) => new Date(s))
  .refine((d) => !Number.isNaN(d.getTime()), 'Invalid date format (expect YYYY-MM-DD or ISO)');

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  pages: z.number().int().positive(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
  sort: SortSpecSchema.optional(),
  note: z.string().optional(),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(payload: T) =>
  z.object({
    powerby: z.string(),
    success: z.boolean(),
    code: z.enum(ApiCode),
    message: z.string(),
    payload,
  });
