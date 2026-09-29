import { z } from 'zod';
import { PaginationInputSchema, pageOf } from '../common';
import { HandleSchema, IsoDateSchema, UuidSchema } from '../domain';
import { FeedbackKindSchema } from './authoring';
import { AuthorRefSchema } from './catalog';

export const ReviewSchema = z.object({
  id: UuidSchema,
  rating: z.number().int().min(1).max(5),
  body: z.string(),
  spoiler: z.boolean(),
  author: AuthorRefSchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});
export type Review = z.infer<typeof ReviewSchema>;

export const ListReviewsInputSchema = PaginationInputSchema.extend({ storyId: UuidSchema });
export const ReviewPageSchema = pageOf(ReviewSchema);

export const UpsertReviewInputSchema = z.object({
  storyId: UuidSchema,
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(3000).default(''),
  spoiler: z.boolean().default(false),
});

export const StoryRefInputSchema = z.object({ storyId: UuidSchema });

export const ToggleOutputSchema = z.object({ active: z.boolean() });

export const FollowInputSchema = z.object({ handle: HandleSchema });

export const SendFeedbackInputSchema = z.object({
  storyId: UuidSchema,
  passageId: z.string().max(64).optional(),
  kind: FeedbackKindSchema,
  body: z.string().trim().min(3).max(2000),
});

export const REPORT_REASONS = [
  'hate',
  'harassment',
  'sexual_content',
  'violence',
  'plagiarism',
  'spam',
  'minor_safety',
  'other',
] as const;
export const ReportReasonSchema = z.enum(REPORT_REASONS);
export const ReportTargetSchema = z.enum(['story', 'review', 'profile']);

export const CreateReportInputSchema = z.object({
  targetType: ReportTargetSchema,
  targetId: z.string().min(1).max(64),
  reason: ReportReasonSchema,
  details: z.string().trim().max(2000).default(''),
});
