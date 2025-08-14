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
