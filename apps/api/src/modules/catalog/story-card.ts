import type { AgeRating, Genre, StoryCard } from '@dedale/contracts';
import { AGE_RATINGS } from '@dedale/contracts';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../../infrastructure/db/client';
import { profiles, stories, storyVersions } from '../../infrastructure/db/schema';

/** Colonnes nécessaires à une carte de récit (jointure auteur + version publiée). */
export const cardColumns = {
  id: stories.id,
  slug: stories.slug,
  title: stories.title,
  tagline: stories.tagline,
  coverUrl: stories.coverUrl,
  genres: stories.genres,
  language: stories.language,
  ageRating: stories.ageRating,
  access: stories.access,
  priceCents: stories.priceCents,
  authorId: stories.authorId,
  authorHandle: profiles.handle,
  authorName: profiles.displayName,
  authorAvatar: profiles.avatarUrl,
  readsCount: stories.readsCount,
  ratingSum: stories.ratingSum,
  ratingCount: stories.ratingCount,
  firstPublishedAt: stories.firstPublishedAt,
  stats: storyVersions.stats,
};

/** Requête de base des cartes : récit + auteur + version publiée. */
export function cardQuery(db: Database) {
  return db
    .select(cardColumns)
    .from(stories)
    .innerJoin(profiles, eq(profiles.userId, stories.authorId))
    .leftJoin(storyVersions, eq(storyVersions.id, stories.publishedVersionId))
    .$dynamic();
}

export type CardRow = Awaited<ReturnType<typeof cardQuery>>[number];

/** Note bayésienne : évite qu'un récit noté 5/5 une seule fois domine le classement. */
export const bayesianRating = sql<number>`(${stories.ratingSum} + 5 * 3.5) / (${stories.ratingCount} + 5)`;

/** Score de tendance décru à l'instant de la requête (demi-vie ≈ 7 jours). */
export const decayedTrending = sql<number>`${stories.trendingScore} * exp(-extract(epoch from (now() - ${stories.trendingAt})) / 872542)`;

export const minutesOf = sql<number>`coalesce((${storyVersions.stats} ->> 'minutes')::int, 0)`;

export function toStoryCard(row: CardRow): StoryCard {
  const stats = row.stats;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    coverUrl: row.coverUrl,
    genres: row.genres as Genre[],
    language: row.language,
    ageRating: row.ageRating as AgeRating,
    access: row.access,
    priceCents: row.priceCents,
    author: {
      id: row.authorId,
      handle: row.authorHandle,
      displayName: row.authorName,
      avatarUrl: row.authorAvatar,
    },
    stats: {
      rating: row.ratingCount ? Math.round((row.ratingSum / row.ratingCount) * 10) / 10 : null,
      ratingCount: row.ratingCount,
      reads: row.readsCount,
      endings: stats?.endings ?? 0,
      minutes: stats?.minutes ?? 0,
      difficulty: stats?.difficulty ?? 'balanced',
    },
    publishedAt: row.firstPublishedAt?.toISOString() ?? null,
  };
}

export function allowedAgeRatings(max: AgeRating | undefined): AgeRating[] {
  const limit = max ? AGE_RATINGS.indexOf(max) : AGE_RATINGS.length - 1;
  return AGE_RATINGS.slice(0, limit + 1);
}

/**
 * Transforme une saisie libre en requête plein texte préfixée et sûre :
 * `le pha` → `le & pha:*`.
 */
export function toPrefixQuery(q: string): string | null {
  const words = q
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 8);
  if (words.length === 0) return null;
  return words.map((word, index) => (index === words.length - 1 ? `${word}:*` : word)).join(' & ');
}
