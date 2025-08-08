import { z } from 'zod';

export const DecimalString = z.string().regex(/^-?\d+(\.\d+)?$/, 'Decimal string expected'); // Info: (20250808 - Tzuhan) Prisma Decimal 建議走字串

export const BigIntString = z.string().regex(/^\d+$/, 'BigInt string expected');

export const Id = z.number().int().positive().brand<'Id'>();

export const JsonValue: z.ZodType<unknown> = z.unknown();

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(20),
});
