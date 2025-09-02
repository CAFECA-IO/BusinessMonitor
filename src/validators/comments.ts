import { z } from 'zod';
import { ApiResponseSchema } from '@/validators/common';

export const CommentsQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
  sort: z.enum(['newest', 'oldest', 'most_liked']).optional(),
  page: z.coerce.number().int().min(1, 'page must be >= 1').default(1).optional(),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, 'pageSize must be >= 1')
    .max(100, 'pageSize too large')
    .default(20)
    .optional(),
});

export const CompanyCommentItemSchema = z.object({
  id: z.number().int(),
  userName: z.string().nullable().optional(),
  userAvatar: z.string().nullable().optional(),
  content: z.string(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  likes: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  shares: z.number().int().nonnegative(),
});

export type CompanyCommentItem = z.infer<typeof CompanyCommentItemSchema>;

export const CompanyCommentsPayloadSchema = z.object({
  items: z.array(CompanyCommentItemSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  pages: z.number().int().positive(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
  sort: z.any().optional(),
  note: z.string().optional(),
});

export const CompanyCommentsResponseSchema = ApiResponseSchema(CompanyCommentsPayloadSchema);
export type CompanyCommentsResponse = z.infer<typeof CompanyCommentsResponseSchema>;
