import type { SaveData, Story } from '@dedale/engine';
import {
  type AnyPgColumn,
  bigint,
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../../../shared/ids';
import { user } from './auth';

const id = () =>
  uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7());
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const userRef = (name: string) => text(name).references(() => user.id, { onDelete: 'cascade' });

/** Statistiques calculées à la publication (analyse statique + simulation). */
export interface VersionStats {
  passages: number;
  words: number;
  choices: number;
  achievements: number;
  endings: number;
  endingsByKind: Record<'victory' | 'defeat' | 'death' | 'neutral' | 'secret', number>;
  minutes: number;
  difficulty: 'gentle' | 'balanced' | 'challenging' | 'brutal';
  failureRate: number;
}

// --- Identité publique --------------------------------------------------------

export const profiles = pgTable('profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  handle: text('handle').notNull().unique(),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  links: jsonb('links').$type<{ label: string; url: string }[]>().notNull().default([]),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const follows = pgTable(
  'follows',
  {
    followerId: userRef('follower_id').notNull(),
    authorId: userRef('author_id').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.authorId] }),
    index('follows_author_idx').on(table.authorId),
  ],
);

// --- Récits ---------------------------------------------------------------------

export const stories = pgTable(
  'stories',
  {
    id: id(),
    authorId: userRef('author_id').notNull(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    tagline: text('tagline'),
    synopsis: text('synopsis').notNull().default(''),
    language: text('language').notNull().default('fr'),
    genres: text('genres').array().notNull().default([]),
    tags: text('tags').array().notNull().default([]),
    ageRating: text('age_rating', { enum: ['all', '10', '13', '16'] })
      .notNull()
      .default('all'),
    contentWarnings: text('content_warnings').array().notNull().default([]),
    access: text('access', { enum: ['free', 'premium', 'paid'] })
      .notNull()
      .default('free'),
    priceCents: integer('price_cents'),
    license: text('license').notNull().default('all-rights-reserved'),
    aiUsage: text('ai_usage', { enum: ['none', 'assisted', 'generated'] })
      .notNull()
      .default('none'),
    coverUrl: text('cover_url'),
    status: text('status', { enum: ['draft', 'published', 'unlisted', 'suspended', 'archived'] })
      .notNull()
      .default('draft'),
    draft: jsonb('draft').$type<Story>().notNull(),
    draftRevision: integer('draft_revision').notNull().default(0),
    draftUpdatedAt: timestamp('draft_updated_at', { withTimezone: true }).notNull().defaultNow(),
    publishedVersionId: uuid('published_version_id').references(
      (): AnyPgColumn => storyVersions.id,
      { onDelete: 'set null' },
    ),
    firstPublishedAt: timestamp('first_published_at', { withTimezone: true }),
    readsCount: integer('reads_count').notNull().default(0),
    completionsCount: integer('completions_count').notNull().default(0),
    favoritesCount: integer('favorites_count').notNull().default(0),
    ratingSum: integer('rating_sum').notNull().default(0),
    ratingCount: integer('rating_count').notNull().default(0),
    /** Lectures récentes pondérées par l'ancienneté (tri « tendances »). */
    trendingScore: doublePrecision('trending_score').notNull().default(0),
    trendingAt: timestamp('trending_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('stories_author_idx').on(table.authorId),
    index('stories_status_trending_idx').on(table.status, table.trendingScore),
    index('stories_status_published_idx').on(table.status, table.firstPublishedAt),
  ],
);

export const storyVersions = pgTable(
  'story_versions',
  {
    id: id(),
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    number: integer('number').notNull(),
    document: jsonb('document').$type<Story>().notNull(),
    checksum: text('checksum').notNull(),
    stats: jsonb('stats').$type<VersionStats>().notNull(),
    changelog: text('changelog'),
    publishedBy: userRef('published_by'),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('story_versions_story_number_idx').on(table.storyId, table.number)],
);

export const collections = pgTable('collections', {
  id: id(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  storyIds: uuid('story_ids').array().notNull().default([]),
  featured: boolean('featured').notNull().default(false),
  createdAt: createdAt(),
});

// --- Lecture --------------------------------------------------------------------

export const saves = pgTable(
  'saves',
  {
    id: id(),
    userId: userRef('user_id').notNull(),
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    versionId: uuid('version_id')
      .notNull()
      .references(() => storyVersions.id, { onDelete: 'cascade' }),
    slot: text('slot', { enum: ['auto', '1', '2', '3'] }).notNull(),
    data: jsonb('data').$type<SaveData>().notNull(),
    passageId: text('passage_id').notNull(),
    status: text('status', { enum: ['playing', 'ended'] }).notNull(),
    endingPassageId: text('ending_passage_id'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('saves_user_story_slot_idx').on(table.userId, table.storyId, table.slot),
    index('saves_user_updated_idx').on(table.userId, table.updatedAt),
  ],
);

export const endingsDiscovered = pgTable(
  'endings_discovered',
  {
    userId: userRef('user_id').notNull(),
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    passageId: text('passage_id').notNull(),
    discoveredAt: timestamp('discovered_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.storyId, table.passageId] })],
);

/** Compteurs agrégés et anonymes (aucune donnée personnelle). */
export const passageStats = pgTable(
  'passage_stats',
  {
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    passageId: text('passage_id').notNull(),
    visits: bigint('visits', { mode: 'number' }).notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.storyId, table.passageId] })],
);

export const choiceStats = pgTable(
  'choice_stats',
  {
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    passageId: text('passage_id').notNull(),
    choiceId: text('choice_id').notNull(),
    count: bigint('count', { mode: 'number' }).notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.storyId, table.passageId, table.choiceId] })],
);

export const endingStats = pgTable(
  'ending_stats',
  {
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    passageId: text('passage_id').notNull(),
    count: bigint('count', { mode: 'number' }).notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.storyId, table.passageId] })],
);

export const dailyStoryStats = pgTable(
  'daily_story_stats',
  {
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    day: date('day', { mode: 'string' }).notNull(),
    starts: integer('starts').notNull().default(0),
    completions: integer('completions').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.storyId, table.day] })],
);

// --- Communauté -----------------------------------------------------------------

export const reviews = pgTable(
  'reviews',
  {
    id: id(),
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    userId: userRef('user_id').notNull(),
    rating: smallint('rating').notNull(),
    body: text('body').notNull().default(''),
    spoiler: boolean('spoiler').notNull().default(false),
    status: text('status', { enum: ['visible', 'hidden'] })
      .notNull()
      .default('visible'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('reviews_story_user_idx').on(table.storyId, table.userId),
    index('reviews_story_created_idx').on(table.storyId, table.createdAt),
  ],
);

export const favorites = pgTable(
  'favorites',
  {
    userId: userRef('user_id').notNull(),
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.storyId] })],
);

export const feedback = pgTable(
  'feedback',
  {
    id: id(),
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    passageId: text('passage_id'),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    kind: text('kind', { enum: ['typo', 'suggestion', 'bug', 'praise'] }).notNull(),
    body: text('body').notNull(),
    status: text('status', { enum: ['open', 'resolved'] })
      .notNull()
      .default('open'),
    createdAt: createdAt(),
  },
  (table) => [index('feedback_story_status_idx').on(table.storyId, table.status)],
);

// --- Modération -----------------------------------------------------------------

export const reports = pgTable(
  'reports',
  {
    id: id(),
    reporterId: text('reporter_id').references(() => user.id, { onDelete: 'set null' }),
    targetType: text('target_type', { enum: ['story', 'review', 'profile'] }).notNull(),
    targetId: text('target_id').notNull(),
    reason: text('reason').notNull(),
    details: text('details').notNull().default(''),
    status: text('status', { enum: ['open', 'dismissed', 'actioned'] })
      .notNull()
      .default('open'),
    resolvedBy: text('resolved_by').references(() => user.id, { onDelete: 'set null' }),
    resolution: text('resolution'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [index('reports_status_created_idx').on(table.status, table.createdAt)],
);

export const moderationLog = pgTable('moderation_log', {
  id: id(),
  actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  note: text('note').notNull().default(''),
  createdAt: createdAt(),
});

// --- Monétisation ---------------------------------------------------------------

export const subscriptions = pgTable('subscriptions', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['wanderer', 'explorer', 'family', 'architect', 'studio'] })
    .notNull()
    .default('wanderer'),
  status: text('status', { enum: ['active', 'trialing', 'past_due', 'canceled'] })
    .notNull()
    .default('active'),
  interval: text('interval', { enum: ['month', 'year'] }),
  provider: text('provider', { enum: ['stripe', 'apple', 'google', 'manual'] }),
  providerCustomerId: text('provider_customer_id'),
  providerSubscriptionId: text('provider_subscription_id'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const purchases = pgTable(
  'purchases',
  {
    id: id(),
    userId: userRef('user_id').notNull(),
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'restrict' }),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('EUR'),
    provider: text('provider').notNull(),
    providerRef: text('provider_ref').notNull().unique(),
    status: text('status', { enum: ['paid', 'refunded'] })
      .notNull()
      .default('paid'),
    createdAt: createdAt(),
  },
  (table) => [index('purchases_user_story_idx').on(table.userId, table.storyId)],
);

/** Grand livre des revenus auteurs (écritures immuables). */
export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id: id(),
    authorId: userRef('author_id').notNull(),
    storyId: uuid('story_id').references(() => stories.id, { onDelete: 'set null' }),
    kind: text('kind', { enum: ['sale', 'tip', 'pool', 'payout', 'refund'] }).notNull(),
    grossCents: integer('gross_cents').notNull(),
    authorCents: integer('author_cents').notNull(),
    platformCents: integer('platform_cents').notNull(),
    currency: text('currency').notNull().default('EUR'),
    sourceRef: text('source_ref').notNull().unique(),
    createdAt: createdAt(),
  },
  (table) => [index('ledger_author_created_idx').on(table.authorId, table.createdAt)],
);
