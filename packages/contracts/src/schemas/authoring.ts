import { EndingKindSchema, StorySchema } from '@dedale/engine';
import { z } from 'zod';
import {
  AccessModelSchema,
  AgeRatingSchema,
  AiUsageSchema,
  ContentWarningSchema,
  GenreSchema,
  IsoDateSchema,
  LicenseSchema,
  SlugSchema,
  StoryStatusSchema,
  UuidSchema,
} from '../domain';

export const StoryMetaSchema = z.object({
  title: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(160).nullable(),
  synopsis: z.string().trim().max(4000),
  language: z.string().min(2).max(12),
  genres: z.array(GenreSchema).min(1).max(3),
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
  ageRating: AgeRatingSchema,
  contentWarnings: z.array(ContentWarningSchema),
  access: AccessModelSchema,
  priceCents: z.number().int().min(99).max(4999).nullable(),
  license: LicenseSchema,
  aiUsage: AiUsageSchema,
  coverUrl: z.url().nullable(),
});
export type StoryMeta = z.infer<typeof StoryMetaSchema>;

export const VersionSummarySchema = z.object({
  id: UuidSchema,
  number: z.number().int(),
  changelog: z.string().nullable(),
  publishedAt: IsoDateSchema,
});

export const StudioStorySchema = z.object({
  id: UuidSchema,
  slug: SlugSchema,
  title: z.string(),
  coverUrl: z.string().nullable(),
  genres: z.array(GenreSchema),
  status: StoryStatusSchema,
  access: AccessModelSchema,
  updatedAt: IsoDateSchema,
  publishedVersion: z.number().int().nullable(),
  passages: z.number().int(),
  reads: z.number().int(),
  rating: z.number().nullable(),
  openFeedback: z.number().int(),
});
export type StudioStory = z.infer<typeof StudioStorySchema>;

export const DraftSchema = z.object({
  id: UuidSchema,
  slug: SlugSchema,
  status: StoryStatusSchema,
  meta: StoryMetaSchema,
  document: StorySchema,
  revision: z.number().int(),
  updatedAt: IsoDateSchema,
  versions: z.array(VersionSummarySchema),
});
export type Draft = z.infer<typeof DraftSchema>;

export const CreateStoryInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  language: z.string().min(2).max(12).default('fr'),
  genres: z.array(GenreSchema).min(1).max(3).default(['adventure']),
  template: z.enum(['blank', 'classic']).default('classic'),
});

export const StoryIdInputSchema = z.object({ id: UuidSchema });

export const SaveDraftInputSchema = z.object({
  id: UuidSchema,
  /** Révision connue du client : protège contre l'écrasement concurrent. */
  revision: z.number().int().min(0),
  document: StorySchema,
});

export const DiagnosticSchema = z.object({
  code: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string(),
  passage: z.string().optional(),
  choice: z.string().optional(),
  ref: z.string().optional(),
});

export const AnalysisSummarySchema = z.object({
  errors: z.number().int(),
  warnings: z.number().int(),
  publishable: z.boolean(),
  diagnostics: z.array(DiagnosticSchema),
});
export type AnalysisSummary = z.infer<typeof AnalysisSummarySchema>;

export const SaveDraftOutputSchema = z.object({
  revision: z.number().int(),
  updatedAt: IsoDateSchema,
  analysis: AnalysisSummarySchema,
});

export const UpdateMetaInputSchema = z.object({ id: UuidSchema, meta: StoryMetaSchema });

export const PublishInputSchema = z.object({
  id: UuidSchema,
  changelog: z.string().trim().max(500).optional(),
  visibility: z.enum(['public', 'unlisted']).default('public'),
});

export const PublishOutputSchema = z.object({
  version: VersionSummarySchema,
  analysis: AnalysisSummarySchema,
});

export const ImportTweeInputSchema = z.object({
  source: z.string().min(1).max(2_000_000),
  language: z.string().min(2).max(12).default('fr'),
});

export const ImportOutputSchema = z.object({
  id: UuidSchema,
  warnings: z.array(z.object({ passage: z.string().nullable(), message: z.string() })),
});

export const GamebookOutputSchema = z.object({ markdown: z.string(), sections: z.number().int() });

export const StoryAnalyticsSchema = z.object({
  /** Statistiques avancées (carte de chaleur, analyse des choix) : offre Architecte. */
  advanced: z.boolean(),
  readers: z.number().int(),
  starts: z.number().int(),
  completions: z.number().int(),
  completionRate: z.number(),
  rating: z.object({ average: z.number().nullable(), count: z.number().int() }),
  passages: z.array(z.object({ passageId: z.string(), visits: z.number().int() })),
  choices: z.array(
    z.object({ passageId: z.string(), choiceId: z.string(), count: z.number().int() }),
  ),
  endings: z.array(
    z.object({
      passageId: z.string(),
      title: z.string(),
      kind: EndingKindSchema,
      count: z.number().int(),
    }),
  ),
  daily: z.array(
    z.object({ date: z.string(), starts: z.number().int(), completions: z.number().int() }),
  ),
});
export type StoryAnalytics = z.infer<typeof StoryAnalyticsSchema>;

export const FeedbackKindSchema = z.enum(['typo', 'suggestion', 'bug', 'praise']);

export const FeedbackSchema = z.object({
  id: UuidSchema,
  kind: FeedbackKindSchema,
  body: z.string(),
  passageId: z.string().nullable(),
  status: z.enum(['open', 'resolved']),
  author: z.object({ handle: z.string(), displayName: z.string() }).nullable(),
  createdAt: IsoDateSchema,
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const ResolveFeedbackInputSchema = z.object({ id: UuidSchema });
