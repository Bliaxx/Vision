import { z } from 'zod';
import { PaginationInputSchema, pageOf } from '../common';
import { IsoDateSchema, UuidSchema } from '../domain';
import { ReportReasonSchema, ReportTargetSchema } from './community';

export const ReportStatusSchema = z.enum(['open', 'dismissed', 'actioned']);

export const ReportSchema = z.object({
  id: UuidSchema,
  targetType: ReportTargetSchema,
  targetId: z.string(),
  targetLabel: z.string().nullable(),
  reason: ReportReasonSchema,
  details: z.string(),
  status: ReportStatusSchema,
  reporter: z.object({ handle: z.string() }).nullable(),
  createdAt: IsoDateSchema,
  resolvedAt: IsoDateSchema.nullable(),
});
export type Report = z.infer<typeof ReportSchema>;

export const ReportQueueInputSchema = PaginationInputSchema.extend({
  status: ReportStatusSchema.default('open'),
});
export const ReportPageSchema = pageOf(ReportSchema);

export const ResolveReportInputSchema = z.object({
  id: UuidSchema,
  action: z.enum(['dismiss', 'hide', 'suspend']),
  note: z.string().trim().max(1000).default(''),
});
