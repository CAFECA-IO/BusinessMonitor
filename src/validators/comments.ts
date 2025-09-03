import { z } from 'zod';
import { ApiResponseSchema, PageQuery } from '@/validators';

export enum CommentSort {
  newest = 'newest',
  oldest = 'oldest',
  most_liked = 'most_liked',
}

// GET /companies/:id/comments 的 Query
export const CommentsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  sort: z.enum(CommentSort).default(CommentSort.newest),
  page: PageQuery.shape.page,
  pageSize: PageQuery.shape.pageSize,
});

export const CompanyCommentItemSchema = z.object({
  id: z.number().int().positive(),
  userName: z.string().nullable(),
  userAvatar: z.string().nullable(),
  content: z.string(),
  createdAt: z.string(),
  likes: z.number().int(),
  comments: z.number().int(),
  shares: z.number().int(),
});

export type CompanyCommentItem = z.infer<typeof CompanyCommentItemSchema>;

export const CompanyCommentsPayloadSchema = z.object({
  items: z.array(CompanyCommentItemSchema),
  page: PageQuery.shape.page,
  pageSize: PageQuery.shape.pageSize,
  total: z.number().int().nonnegative(),
  pages: z.number().int().positive(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
  sort: z.any().optional(),
  note: z.string().optional(),
});

export const CompanyCommentsResponseSchema = ApiResponseSchema(CompanyCommentsPayloadSchema);
export type CompanyCommentsResponse = z.infer<typeof CompanyCommentsResponseSchema>;
