import { z } from 'zod';
import { ApiResponseSchema, PaginatedOf } from '@/validators/common';
export const FlagColorSchema = z.enum(['red', 'green']);

export const FlagsQuerySchema = z.object({
  type: FlagColorSchema.default('red'),
  page: z.coerce.number().int().min(1, 'page must be >= 1').default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, 'pageSize must be >= 1')
    .max(100, 'pageSize too large')
    .default(20),
});
export type FlagsQuery = z.infer<typeof FlagsQuerySchema>;

export const FlagRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD expected'),
  level: z.number().int().nonnegative(),
  event: z.string(), // = risk_flag.flag_type
});
export type FlagRow = z.infer<typeof FlagRowSchema>;

export const FlagsPayloadSchema = PaginatedOf(FlagRowSchema);
export type FlagsPayload = z.infer<typeof FlagsPayloadSchema>;

export const FlagsResponse = ApiResponseSchema(FlagsPayloadSchema);
