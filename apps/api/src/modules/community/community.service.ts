import type { Review } from '@dedale/contracts';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Viewer } from '../../http/context';
import type { Database } from '../../infrastructure/db/client';
import {
  favorites,
  feedback,
  follows,
  profiles,
  reports,
  reviews,
  stories,
} from '../../infrastructure/db/schema';
import { decodeCursor, paginate } from '../../shared/cursor';
import { ForbiddenError, NotFoundError, RateLimitedError } from '../../shared/errors';
import type { RateLimiter } from '../../shared/rate-limiter';

type ReviewRow = {
  id: string;
  rating: number;
  body: string;
  spoiler: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    rating: row.rating,
    body: row.body,
    spoiler: row.spoiler,
    author: {
      id: row.userId,
      handle: row.handle,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Interactions communautaires : avis, favoris, abonnements, retours, signalements. */
export class CommunityService {
  constructor(
    private readonly db: Database,
    private readonly limiter: RateLimiter,
  ) {}

  private readonly reviewColumns = {
    id: reviews.id,
    rating: reviews.rating,
    body: reviews.body,
    spoiler: reviews.spoiler,
    createdAt: reviews.createdAt,
    updatedAt: reviews.updatedAt,
    userId: reviews.userId,
    handle: profiles.handle,
    displayName: profiles.displayName,
    avatarUrl: profiles.avatarUrl,
  };

  private async storyAuthor(storyId: string): Promise<string> {
    const [story] = await this.db
      .select({ authorId: stories.authorId })
      .from(stories)
      .where(eq(stories.id, storyId));
    if (!story) throw new NotFoundError('récit introuvable');
    return story.authorId;
  }

  private throttle(viewer: Viewer, action: string, limit: number): void {
    if (!this.limiter.consume(`${action}:${viewer.id}`, limit, 60_000)) {
      throw new RateLimitedError('trop de requêtes');
    }
  }

  async reviews(storyId: string, cursor: string | undefined, limit: number) {
    const offset = decodeCursor(cursor);
    const rows = await this.db
      .select(this.reviewColumns)
      .from(reviews)
      .innerJoin(profiles, eq(profiles.userId, reviews.userId))
      .where(and(eq(reviews.storyId, storyId), eq(reviews.status, 'visible')))
      .orderBy(desc(sql`length(${reviews.body}) > 0`), desc(reviews.createdAt))
      .limit(limit + 1)
      .offset(offset);
    const page = paginate(rows, offset, limit);
    return { items: page.items.map(toReview), nextCursor: page.nextCursor };
  }

  /** Crée ou met à jour l'avis du lecteur ; maintient les agrégats atomiquement. */
  async upsertReview(
    viewer: Viewer,
    input: { storyId: string; rating: number; body: string; spoiler: boolean },
  ): Promise<Review> {
    this.throttle(viewer, 'review', 10);
    if ((await this.storyAuthor(input.storyId)) === viewer.id) {
      throw new ForbiddenError('vous ne pouvez pas noter votre propre récit');
    }
    const id = await this.db.transaction(async (tx) => {
      const [previous] = await tx
        .select({ rating: reviews.rating })
        .from(reviews)
        .where(and(eq(reviews.storyId, input.storyId), eq(reviews.userId, viewer.id)))
        .for('update');
      const [saved] = await tx
        .insert(reviews)
        .values({
          storyId: input.storyId,
          userId: viewer.id,
          rating: input.rating,
          body: input.body,
          spoiler: input.spoiler,
        })
        .onConflictDoUpdate({
          target: [reviews.storyId, reviews.userId],
          set: {
            rating: input.rating,
            body: input.body,
            spoiler: input.spoiler,
            updatedAt: new Date(),
          },
        })
        .returning({ id: reviews.id });
      await tx
        .update(stories)
        .set({
          ratingSum: sql`${stories.ratingSum} + ${input.rating - (previous?.rating ?? 0)}`,
          ratingCount: sql`${stories.ratingCount} + ${previous ? 0 : 1}`,
        })
        .where(eq(stories.id, input.storyId));
      return (saved as { id: string }).id;
    });
    const [row] = await this.db
      .select(this.reviewColumns)
      .from(reviews)
      .innerJoin(profiles, eq(profiles.userId, reviews.userId))
      .where(eq(reviews.id, id));
    return toReview(row as ReviewRow);
  }

  async deleteReview(viewer: Viewer, storyId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [removed] = await tx
        .delete(reviews)
        .where(and(eq(reviews.storyId, storyId), eq(reviews.userId, viewer.id)))
        .returning({ rating: reviews.rating });
      if (removed) {
        await tx
          .update(stories)
          .set({
            ratingSum: sql`greatest(${stories.ratingSum} - ${removed.rating}, 0)`,
            ratingCount: sql`greatest(${stories.ratingCount} - 1, 0)`,
          })
          .where(eq(stories.id, storyId));
      }
    });
  }

  async toggleFavorite(viewer: Viewer, storyId: string): Promise<{ active: boolean }> {
    await this.storyAuthor(storyId);
    return this.db.transaction(async (tx) => {
      const removed = await tx
        .delete(favorites)
        .where(and(eq(favorites.userId, viewer.id), eq(favorites.storyId, storyId)))
        .returning({ storyId: favorites.storyId });
      const active = removed.length === 0;
      if (active) await tx.insert(favorites).values({ userId: viewer.id, storyId });
      await tx
        .update(stories)
        .set({ favoritesCount: sql`greatest(${stories.favoritesCount} + ${active ? 1 : -1}, 0)` })
        .where(eq(stories.id, storyId));
      return { active };
    });
  }

  async toggleFollow(viewer: Viewer, handle: string): Promise<{ active: boolean }> {
    const [author] = await this.db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.handle, handle));
    if (!author) throw new NotFoundError('auteur introuvable');
    if (author.userId === viewer.id)
      throw new ForbiddenError('impossible de vous suivre vous-même');
    const removed = await this.db
      .delete(follows)
      .where(and(eq(follows.followerId, viewer.id), eq(follows.authorId, author.userId)))
      .returning({ authorId: follows.authorId });
    if (removed.length > 0) return { active: false };
    await this.db.insert(follows).values({ followerId: viewer.id, authorId: author.userId });
    return { active: true };
  }

  async sendFeedback(
    viewer: Viewer,
    input: {
      storyId: string;
      passageId?: string | undefined;
      kind: 'typo' | 'suggestion' | 'bug' | 'praise';
      body: string;
    },
  ): Promise<void> {
    this.throttle(viewer, 'feedback', 10);
    await this.storyAuthor(input.storyId);
    await this.db.insert(feedback).values({
      storyId: input.storyId,
      passageId: input.passageId ?? null,
      userId: viewer.id,
      kind: input.kind,
      body: input.body,
    });
  }

  async report(
    viewer: Viewer,
    input: {
      targetType: 'story' | 'review' | 'profile';
      targetId: string;
      reason: string;
      details: string;
    },
  ): Promise<void> {
    this.throttle(viewer, 'report', 5);
    await this.db.insert(reports).values({ ...input, reporterId: viewer.id });
  }
}
