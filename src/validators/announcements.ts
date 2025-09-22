import { z } from 'zod';
import { apiResponseSchema } from '@/validators';

export const announcementsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, 'limit must be >= 1')
    .max(100, 'limit too large')
    .default(10)
    .optional(),
});
export type AnnouncementsQuery = z.infer<typeof announcementsQuerySchema>;

export const announcementItemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  content: z.string().optional(),
  imageUrl: z.url().optional(),
  views: z.number().int().nonnegative().optional(),
  shares: z.number().int().nonnegative().optional(),
  isPinned: z.boolean().optional(),
});
export type AnnouncementItem = z.infer<typeof announcementItemSchema>;

export const announcementsResponseSchema = apiResponseSchema(z.array(announcementItemSchema));
export type AnnouncementsResponse = z.infer<typeof announcementsResponseSchema>;
