import { z } from 'zod';
import { DateParam, PageQuery, StringArrayParam, PaginatedOf } from '@/validators';

/** Info: (20250821 - Tzuhan) 查詢參數 */
export const CompanyNewsQuerySchema = PageQuery.extend({
  q: z.string().min(1).max(200).optional(),
  from: DateParam.optional(),
  to: DateParam.optional(),
  sort: z.enum(['newest', 'relevance']).default('newest'),
  lang: z.string().min(1).max(10).optional(),
  source: StringArrayParam, // Info: (20250821 - Tzuhan) e.g. ?source=Bloomberg&source=Reuters 或 ?source=Bloomberg,Reuters
});
export type CompanyNewsQuery = z.infer<typeof CompanyNewsQuerySchema>;

/** Info: (20250821 - Tzuhan) 回傳項目 */
export const NewsItemSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  content: z.string().nullable().optional(),
  date: z.string(), // Info: (20250821 - Tzuhan) ISO string
  imageUrl: z.string().url().optional().or(z.string().min(1).optional()),
  lang: z.string().optional(),
  source: z.string().optional(),
  url: z.string().url().optional(),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export const CompanyNewsPayloadSchema = PaginatedOf(NewsItemSchema);
export type CompanyNewsPayload = z.infer<typeof CompanyNewsPayloadSchema>;
