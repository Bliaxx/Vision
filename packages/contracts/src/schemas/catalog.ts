import { EndingKindSchema } from '@dedale/engine';
import { z } from 'zod';
import { PaginationInputSchema, pageOf } from '../common';
import {
  AccessModelSchema,
  AgeRatingSchema,
  AiUsageSchema,
  ContentWarningSchema,
  DifficultySchema,
  GenreSchema,
  HandleSchema,
  IsoDateSchema,
  LicenseSchema,
  SlugSchema,
  UuidSchema,
} from '../domain';

export const AuthorRefSchema = z.object({
  id: z.string(),
  handle: HandleSchema,
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
});
export type AuthorRef = z.infer<typeof AuthorRefSchema>;

export const StoryCardStatsSchema = z.object({
  rating: z.number().min(0).max(5).nullable(),
  ratingCount: z.number().int(),
  reads: z.number().int(),
  endings: z.number().int(),
  minutes: z.number().int(),
  difficulty: DifficultySchema,
});

export const StoryCardSchema = z.object({
  id: UuidSchema,
  slug: SlugSchema,
  title: z.string(),
  tagline: z.string().nullable(),
  coverUrl: z.string().nullable(),
  genres: z.array(GenreSchema),
  language: z.string(),
  ageRating: AgeRatingSchema,
  access: AccessModelSchema,
  priceCents: z.number().int().nullable(),
  author: AuthorRefSchema,
  stats: StoryCardStatsSchema,
  publishedAt: IsoDateSchema.nullable(),
});
export type StoryCard = z.infer<typeof StoryCardSchema>;

export const EntitlementReasonSchema = z.enum([
  'free',
  'premium',
  'purchased',
  'author',
  'locked_premium',
  'locked_paid',
  'unavailable',
]);
export type EntitlementReason = z.infer<typeof EntitlementReasonSchema>;

export const StoryDetailSchema = StoryCardSchema.extend({
  synopsis: z.string(),
  license: LicenseSchema,
  aiUsage: AiUsageSchema,
  contentWarnings: z.array(ContentWarningSchema),
  tags: z.array(z.string()),
  version: z.object({ id: UuidSchema, number: z.number().int(), publishedAt: IsoDateSchema }),
  details: z.object({
    passages: z.number().int(),
    words: z.number().int(),
    achievements: z.number().int(),
    endingsByKind: z.record(EndingKindSchema, z.number().int()),
    failureRate: z.number(),
  }),
  ratingDistribution: z.array(z.number().int()).length(5),
  access: AccessModelSchema,
  entitlement: z.object({ canRead: z.boolean(), reason: EntitlementReasonSchema }),
  viewer: z
    .object({
      favorite: z.boolean(),
      followingAuthor: z.boolean(),
      progress: z
        .object({ status: z.enum(['playing', 'ended']), updatedAt: IsoDateSchema })
        .nullable(),
      endingsDiscovered: z.number().int(),
      myRating: z.number().int().min(1).max(5).nullable(),
    })
    .nullable(),
});
export type StoryDetail = z.infer<typeof StoryDetailSchema>;

export const CatalogSortSchema = z.enum(['trending', 'new', 'top', 'short']);
export type CatalogSort = z.infer<typeof CatalogSortSchema>;

export const CatalogQuerySchema = PaginationInputSchema.extend({
  q: z.string().trim().max(100).optional(),
  genre: GenreSchema.optional(),
  language: z.string().max(12).optional(),
  maxAgeRating: AgeRatingSchema.optional(),
  access: AccessModelSchema.optional(),
  sort: CatalogSortSchema.default('trending'),
  author: HandleSchema.optional(),
});
export type CatalogQuery = z.infer<typeof CatalogQuerySchema>;

export const StoryCardPageSchema = pageOf(StoryCardSchema);

export const HomeRailSchema = z.object({
  key: z.enum(['trending', 'new', 'staff-picks', 'short', 'youth', 'premium']),
  stories: z.array(StoryCardSchema),
});

export const HomeSchema = z.object({
  featured: StoryCardSchema.nullable(),
  rails: z.array(HomeRailSchema),
  genres: z.array(z.object({ genre: GenreSchema, count: z.number().int() })),
  totals: z.object({
    stories: z.number().int(),
    authors: z.number().int(),
    reads: z.number().int(),
  }),
});
export type Home = z.infer<typeof HomeSchema>;

export const AuthorProfileSchema = AuthorRefSchema.extend({
  bio: z.string().nullable(),
  links: z.array(z.object({ label: z.string(), url: z.url() })),
  joinedAt: IsoDateSchema,
  followers: z.number().int(),
  following: z.boolean(),
  stories: z.array(StoryCardSchema),
  totals: z.object({ reads: z.number().int(), stories: z.number().int() }),
});
export type AuthorProfile = z.infer<typeof AuthorProfileSchema>;

export const StorySlugInputSchema = z.object({ slug: SlugSchema });
export const HandleInputSchema = z.object({ handle: HandleSchema });
