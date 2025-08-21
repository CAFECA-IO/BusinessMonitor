import { z } from 'zod';
import { DateParam, StringArrayParam } from '@/validators/common';

/** Info: (20250821 - Tzuhan) 查詢參數 */
export const CompanyNewsQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
  from: DateParam.optional(),
  to: DateParam.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['newest', 'relevance']).default('newest'),
  lang: z.string().min(1).max(10).optional(),
  source: StringArrayParam, // Info: (20250821 - Tzuhan) e.g. ?source=Bloomberg&source=Reuters 或 ?source=Bloomberg,Reuters
});

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

/** Info: (20250821 - Tzuhan) 分頁包裝 */
export const PaginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalPages: z.number().int().nonnegative(),
    hasPrev: z.boolean(),
    hasNext: z.boolean(),
  });

export const CompanyNewsPayloadSchema = PaginatedSchema(NewsItemSchema);
export type CompanyNewsPayload = z.infer<typeof CompanyNewsPayloadSchema>;
