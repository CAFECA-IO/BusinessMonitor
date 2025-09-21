import { z } from 'zod';
import { apiResponseSchema, pageQuerySchema } from '@/validators';

export enum CommentSort {
  newest = 'newest',
  oldest = 'oldest',
  most_liked = 'most_liked',
}

// Info: (20250903 - Tzuhan) GET /companies/:id/comments 的 Query
export const commentsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  sort: z.enum(CommentSort).default(CommentSort.newest),
  page: pageQuerySchema.shape.page,
  pageSize: pageQuerySchema.shape.pageSize,
});

export const companyCommentItemSchema = z.object({
  id: z.number().int().positive(),
  userName: z.string().nullable(),
  userAvatar: z.string().nullable(),
  content: z.string(),
  createdAt: z.string(),
  likes: z.number().int(),
  comments: z.number().int(),
  shares: z.number().int(),
});

export type CompanyCommentItem = z.infer<typeof companyCommentItemSchema>;

export const companyCommentsPayloadSchema = z.object({
  items: z.array(companyCommentItemSchema),
  page: pageQuerySchema.shape.page,
  pageSize: pageQuerySchema.shape.pageSize,
  total: z.number().int().nonnegative(),
  pages: z.number().int().positive(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
  sort: z.any().optional(),
  note: z.string().optional(),
});

export const companyCommentsResponseSchema = apiResponseSchema(companyCommentsPayloadSchema);
export type CompanyCommentsResponse = z.infer<typeof companyCommentsResponseSchema>;
