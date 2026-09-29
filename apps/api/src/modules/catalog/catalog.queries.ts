import type {
  AuthorProfile,
  CatalogQuery,
  Genre,
  Home,
  StoryCard,
  StoryDetail,
} from '@dedale/contracts';
import { GENRES } from '@dedale/contracts';
import { and, arrayContains, count, desc, eq, inArray, type SQL, sql, sum } from 'drizzle-orm';
import type { Viewer } from '../../http/context';
import type { Database } from '../../infrastructure/db/client';
import {
  collections,
  endingsDiscovered,
  favorites,
  follows,
  profiles,
  purchases,
  reviews,
  saves,
  stories,
  storyVersions,
  user,
} from '../../infrastructure/db/schema';
import { decodeCursor, paginate } from '../../shared/cursor';
import { NotFoundError } from '../../shared/errors';
import { readingAccess } from '../billing/entitlement.policy';
import {
  allowedAgeRatings,
  bayesianRating,
  type CardRow,
  cardQuery,
  decayedTrending,
  minutesOf,
  toPrefixQuery,
  toStoryCard,
} from './story-card';

const LISTED = eq(stories.status, 'published');

/**
 * Modèles de lecture du catalogue (côté « requêtes » du CQRS léger) : SQL
 * direct et optimisé, sans passer par les agrégats du domaine.
 */
export class CatalogQueries {
  constructor(private readonly db: Database) {}

  async list(query: CatalogQuery): Promise<{ items: StoryCard[]; nextCursor: string | null }> {
    const offset = decodeCursor(query.cursor);
    const filters: SQL[] = [
      LISTED,
      inArray(stories.ageRating, allowedAgeRatings(query.maxAgeRating)),
    ];
    if (query.genre) filters.push(arrayContains(stories.genres, [query.genre]));
    if (query.language) filters.push(eq(stories.language, query.language));
    if (query.access) filters.push(eq(stories.access, query.access));
    if (query.author) filters.push(eq(profiles.handle, query.author));

    const tsQuery = query.q ? toPrefixQuery(query.q) : null;
    if (query.q) {
      const pattern = `%${query.q.replace(/[%_\\]/g, '\\$&')}%`;
      filters.push(
        tsQuery
          ? sql`(${sql.raw('stories.search')} @@ to_tsquery('simple', ${tsQuery}) or dedale_unaccent(${stories.title}) ilike dedale_unaccent(${pattern}))`
          : sql`dedale_unaccent(${stories.title}) ilike dedale_unaccent(${pattern})`,
      );
    }

    const order: SQL[] = [];
    if (tsQuery) {
      order.push(
        desc(sql`ts_rank(${sql.raw('stories.search')}, to_tsquery('simple', ${tsQuery}))`),
      );
    }
    switch (query.sort) {
      case 'new':
        order.push(desc(stories.firstPublishedAt));
        break;
      case 'top':
        order.push(desc(bayesianRating));
        break;
      case 'short':
        order.push(sql`${minutesOf} asc`);
        break;
      case 'trending':
        order.push(desc(decayedTrending), desc(stories.readsCount));
        break;
    }
    order.push(desc(stories.id));

    const rows = await cardQuery(this.db)
      .where(and(...filters))
      .orderBy(...order)
      .limit(query.limit + 1)
      .offset(offset);
    const page = paginate(rows, offset, query.limit);
    return { items: page.items.map(toStoryCard), nextCursor: page.nextCursor };
  }

  private async rail(where: SQL, order: SQL[], limit = 12): Promise<StoryCard[]> {
    const rows = await cardQuery(this.db)
      .where(and(LISTED, where))
      .orderBy(...order, desc(stories.id))
      .limit(limit);
    return rows.map(toStoryCard);
  }

  async home(): Promise<Home> {
    const [trending, fresh, short, youth, premium, picks, genreCounts, totals] = await Promise.all([
      this.rail(sql`true`, [desc(decayedTrending), desc(stories.readsCount)]),
      this.rail(sql`true`, [desc(stories.firstPublishedAt)]),
      this.rail(sql`${minutesOf} <= 15`, [desc(bayesianRating)]),
      this.rail(inArray(stories.ageRating, ['all', '10']), [desc(bayesianRating)]),
      this.rail(eq(stories.access, 'premium'), [desc(bayesianRating)]),
      this.staffPicks(),
      this.db
        .select({ genre: sql<string>`unnest(${stories.genres})`, count: count() })
        .from(stories)
        .where(LISTED)
        .groupBy(sql`1`),
      this.db
        .select({
          stories: count(),
          authors: sql<number>`count(distinct ${stories.authorId})::int`,
          reads: sql<number>`coalesce(${sum(stories.readsCount)}, 0)::int`,
        })
        .from(stories)
        .where(LISTED),
    ]);

    const counts = new Map(genreCounts.map((row) => [row.genre, row.count]));
    return {
      featured: picks[0] ?? trending[0] ?? null,
      rails: [
        { key: 'trending' as const, stories: trending },
        { key: 'staff-picks' as const, stories: picks },
        { key: 'new' as const, stories: fresh },
        { key: 'short' as const, stories: short },
        { key: 'youth' as const, stories: youth },
        { key: 'premium' as const, stories: premium },
      ].filter((rail) => rail.stories.length > 0),
      genres: GENRES.map((genre: Genre) => ({ genre, count: counts.get(genre) ?? 0 })),
      totals: totals[0] ?? { stories: 0, authors: 0, reads: 0 },
    };
  }

  private async staffPicks(): Promise<StoryCard[]> {
    const [collection] = await this.db
      .select({ storyIds: collections.storyIds })
      .from(collections)
      .where(eq(collections.featured, true))
      .limit(1);
    if (!collection || collection.storyIds.length === 0) return [];
    const rows = await cardQuery(this.db).where(
      and(LISTED, inArray(stories.id, collection.storyIds)),
    );
    const byId = new Map(rows.map((row) => [row.id, row]));
    return collection.storyIds
      .map((id) => byId.get(id))
      .filter((row): row is CardRow => row !== undefined)
      .map(toStoryCard);
  }

  async story(slug: string, viewer: Viewer | null): Promise<StoryDetail> {
    const [row] = await this.db
      .select({
        story: stories,
        authorHandle: profiles.handle,
        authorName: profiles.displayName,
        authorAvatar: profiles.avatarUrl,
        version: {
          id: storyVersions.id,
          number: storyVersions.number,
          publishedAt: storyVersions.publishedAt,
          stats: storyVersions.stats,
        },
      })
      .from(stories)
      .innerJoin(profiles, eq(profiles.userId, stories.authorId))
      .innerJoin(storyVersions, eq(storyVersions.id, stories.publishedVersionId))
      .where(eq(stories.slug, slug));

    const isOwner = viewer !== null && row?.story.authorId === viewer.id;
    if (!row || !(row.story.status === 'published' || row.story.status === 'unlisted' || isOwner)) {
      throw new NotFoundError('récit introuvable');
    }
    const { story, version } = row;

    const distribution = await this.db
      .select({ rating: reviews.rating, count: count() })
      .from(reviews)
      .where(and(eq(reviews.storyId, story.id), eq(reviews.status, 'visible')))
      .groupBy(reviews.rating);
    const ratingDistribution = [1, 2, 3, 4, 5].map(
      (rating) => distribution.find((entry) => entry.rating === rating)?.count ?? 0,
    );

    let purchased = false;
    let viewerState: StoryDetail['viewer'] = null;
    if (viewer) {
      const [favorite, following, progress, discovered, myReview, purchase] = await Promise.all([
        this.db
          .select({ storyId: favorites.storyId })
          .from(favorites)
          .where(and(eq(favorites.userId, viewer.id), eq(favorites.storyId, story.id))),
        this.db
          .select({ authorId: follows.authorId })
          .from(follows)
          .where(and(eq(follows.followerId, viewer.id), eq(follows.authorId, story.authorId))),
        this.db
          .select({ status: saves.status, updatedAt: saves.updatedAt })
          .from(saves)
          .where(and(eq(saves.userId, viewer.id), eq(saves.storyId, story.id)))
          .orderBy(desc(saves.updatedAt))
          .limit(1),
        this.db
          .select({ count: count() })
          .from(endingsDiscovered)
          .where(
            and(eq(endingsDiscovered.userId, viewer.id), eq(endingsDiscovered.storyId, story.id)),
          ),
        this.db
          .select({ rating: reviews.rating })
          .from(reviews)
          .where(and(eq(reviews.userId, viewer.id), eq(reviews.storyId, story.id))),
        this.db
          .select({ id: purchases.id })
          .from(purchases)
          .where(
            and(
              eq(purchases.userId, viewer.id),
              eq(purchases.storyId, story.id),
              eq(purchases.status, 'paid'),
            ),
          )
          .limit(1),
      ]);
      purchased = purchase.length > 0;
      viewerState = {
        favorite: favorite.length > 0,
        followingAuthor: following.length > 0,
        progress: progress[0]
          ? { status: progress[0].status, updatedAt: progress[0].updatedAt.toISOString() }
          : null,
        endingsDiscovered: discovered[0]?.count ?? 0,
        myRating: myReview[0]?.rating ?? null,
      };
    }

    const card = toStoryCard({
      id: story.id,
      slug: story.slug,
      title: story.title,
      tagline: story.tagline,
      coverUrl: story.coverUrl,
      genres: story.genres,
      language: story.language,
      ageRating: story.ageRating,
      access: story.access,
      priceCents: story.priceCents,
      authorId: story.authorId,
      authorHandle: row.authorHandle,
      authorName: row.authorName,
      authorAvatar: row.authorAvatar,
      readsCount: story.readsCount,
      ratingSum: story.ratingSum,
      ratingCount: story.ratingCount,
      firstPublishedAt: story.firstPublishedAt,
      stats: version.stats,
    });

    return {
      ...card,
      synopsis: story.synopsis,
      license: story.license as StoryDetail['license'],
      aiUsage: story.aiUsage,
      contentWarnings: story.contentWarnings as StoryDetail['contentWarnings'],
      tags: story.tags,
      version: {
        id: version.id,
        number: version.number,
        publishedAt: version.publishedAt.toISOString(),
      },
      details: {
        passages: version.stats.passages,
        words: version.stats.words,
        achievements: version.stats.achievements,
        endingsByKind: version.stats.endingsByKind,
        failureRate: version.stats.failureRate,
      },
      ratingDistribution,
      entitlement: readingAccess(story, viewer, purchased),
      viewer: viewerState,
    };
  }

  async author(handle: string, viewer: Viewer | null): Promise<AuthorProfile> {
    const [profile] = await this.db
      .select({
        id: profiles.userId,
        handle: profiles.handle,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        bio: profiles.bio,
        links: profiles.links,
        joinedAt: user.createdAt,
      })
      .from(profiles)
      .innerJoin(user, eq(user.id, profiles.userId))
      .where(eq(profiles.handle, handle));
    if (!profile) throw new NotFoundError('auteur introuvable');

    const [storyRows, [followers], following] = await Promise.all([
      cardQuery(this.db)
        .where(and(LISTED, eq(stories.authorId, profile.id)))
        .orderBy(desc(stories.firstPublishedAt)),
      this.db.select({ count: count() }).from(follows).where(eq(follows.authorId, profile.id)),
      viewer
        ? this.db
            .select({ authorId: follows.authorId })
            .from(follows)
            .where(and(eq(follows.followerId, viewer.id), eq(follows.authorId, profile.id)))
        : Promise.resolve([]),
    ]);
    const cards = storyRows.map(toStoryCard);
    return {
      id: profile.id,
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      links: profile.links,
      joinedAt: profile.joinedAt.toISOString(),
      followers: followers?.count ?? 0,
      following: following.length > 0,
      stories: cards,
      totals: {
        stories: cards.length,
        reads: cards.reduce((total, card) => total + card.stats.reads, 0),
      },
    };
  }
}
