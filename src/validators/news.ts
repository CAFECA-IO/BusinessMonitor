import { z } from 'zod';
import {
  dateParamSchema,
  pageQuerySchema,
  stringArrayParamSchema,
  paginatedOfSchema,
} from '@/validators';

/** Info: (20250821 - Tzuhan) 查詢參數 */
export const companyNewsQuerySchema = pageQuerySchema.extend({
  q: z.string().min(1).max(200).optional(),
  from: dateParamSchema.optional(),
  to: dateParamSchema.optional(),
  sort: z.enum(['newest', 'relevance']).default('newest'),
  lang: z.string().min(1).max(10).optional(),
  source: stringArrayParamSchema, // Info: (20250821 - Tzuhan) e.g. ?source=Bloomberg&source=Reuters 或 ?source=Bloomberg,Reuters
});
export type CompanyNewsQuery = z.infer<typeof companyNewsQuerySchema>;

/** Info: (20250821 - Tzuhan) 回傳項目 */
export const newsItemSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  content: z.string().nullable().optional(),
  date: z.string(), // Info: (20250821 - Tzuhan) ISO string
  imageUrl: z.string().url().optional().or(z.string().min(1).optional()),
  lang: z.string().optional(),
  source: z.string().optional(),
  url: z.string().url().optional(),
});
export type NewsItem = z.infer<typeof newsItemSchema>;

export const companyNewsPayloadSchema = paginatedOfSchema(newsItemSchema);
export type CompanyNewsPayload = z.infer<typeof companyNewsPayloadSchema>;
