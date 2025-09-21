import { z } from 'zod';
import { apiResponseSchema, paginatedOfSchema } from '@/validators';
export const flagColorSchema = z.enum(['red', 'green']);

export const flagsQuerySchema = z.object({
  type: flagColorSchema.default('red'),
  page: z.coerce.number().int().min(1, 'page must be >= 1').default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, 'pageSize must be >= 1')
    .max(100, 'pageSize too large')
    .default(20),
});
export type FlagsQuery = z.infer<typeof flagsQuerySchema>;

export const flagRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD expected'),
  level: z.number().int().nonnegative(),
  event: z.string(), // Info: (20250827 - Tzuhan) = risk_flag.flag_type
});
export type FlagRow = z.infer<typeof flagRowSchema>;

export const flagsPayloadSchema = paginatedOfSchema(flagRowSchema);
export type FlagsPayload = z.infer<typeof flagsPayloadSchema>;

export const flagsResponseSchema = apiResponseSchema(flagsPayloadSchema);
