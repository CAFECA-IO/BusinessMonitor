import { z } from 'zod';
import { ApiResponseSchema } from '@/validators';

export const AnnouncementsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, 'limit must be >= 1')
    .max(100, 'limit too large')
    .default(10)
    .optional(),
});
export type AnnouncementsQuery = z.infer<typeof AnnouncementsQuerySchema>;

export const AnnouncementItemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  content: z.string().optional(),
  imageUrl: z.url().optional(),
  views: z.number().int().nonnegative().optional(),
  shares: z.number().int().nonnegative().optional(),
  isPinned: z.boolean().optional(),
});
export type AnnouncementItem = z.infer<typeof AnnouncementItemSchema>;

export const AnnouncementsResponseSchema = ApiResponseSchema(z.array(AnnouncementItemSchema));
export type AnnouncementsResponse = z.infer<typeof AnnouncementsResponseSchema>;
