import type { StoryMeta, StudioStory } from '@dedale/contracts';
import type { Story } from '@dedale/engine';
import { and, count, desc, eq, max, sql } from 'drizzle-orm';
import type { Database } from '../../infrastructure/db/client';
import {
  feedback,
  stories,
  storyVersions,
  type VersionStats,
} from '../../infrastructure/db/schema';

export type StoryRecord = typeof stories.$inferSelect;

export interface VersionRecord {
  id: string;
  number: number;
  changelog: string | null;
  publishedAt: Date;
  checksum: string;
}

export interface NewVersion {
  document: Story;
  checksum: string;
  stats: VersionStats;
  changelog: string | null;
  publishedBy: string;
  visibility: 'public' | 'unlisted';
}

/** Persistance de l'agrégat « récit » (brouillon + versions publiées). */
export class StoryRepository {
  constructor(private readonly db: Database) {}

  async slugExists(slug: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: stories.id })
      .from(stories)
      .where(eq(stories.slug, slug))
      .limit(1);
    return row !== undefined;
  }

  async insert(values: typeof stories.$inferInsert): Promise<string> {
    const [row] = await this.db.insert(stories).values(values).returning({ id: stories.id });
    return (row as { id: string }).id;
  }

  async findById(id: string): Promise<StoryRecord | null> {
    const [row] = await this.db.select().from(stories).where(eq(stories.id, id));
    return row ?? null;
  }

  async listByAuthor(authorId: string): Promise<StudioStory[]> {
    const openFeedback = this.db
      .select({ storyId: feedback.storyId, open: count().as('open') })
      .from(feedback)
      .where(eq(feedback.status, 'open'))
      .groupBy(feedback.storyId)
      .as('open_feedback');
    const rows = await this.db
      .select({
        story: stories,
        publishedVersion: storyVersions.number,
        open: openFeedback.open,
      })
      .from(stories)
      .leftJoin(storyVersions, eq(storyVersions.id, stories.publishedVersionId))
      .leftJoin(openFeedback, eq(openFeedback.storyId, stories.id))
      .where(eq(stories.authorId, authorId))
      .orderBy(desc(stories.updatedAt));
    return rows.map(({ story, publishedVersion, open }) => ({
      id: story.id,
      slug: story.slug,
      title: story.title,
      coverUrl: story.coverUrl,
      genres: story.genres as StudioStory['genres'],
      status: story.status,
      access: story.access,
      updatedAt: story.updatedAt.toISOString(),
      publishedVersion: publishedVersion ?? null,
      passages: story.draft.passages.length,
      reads: story.readsCount,
      rating: story.ratingCount
        ? Math.round((story.ratingSum / story.ratingCount) * 10) / 10
        : null,
      openFeedback: Number(open ?? 0),
    }));
  }

  /**
   * Concurrence optimiste : l'écriture n'aboutit que si la révision connue du
   * client est toujours la révision courante. Retourne `null` en cas de conflit.
   */
  async saveDraft(
    id: string,
    document: Story,
    expectedRevision: number,
  ): Promise<{ revision: number; updatedAt: Date } | null> {
    const now = new Date();
    const [row] = await this.db
      .update(stories)
      .set({
        draft: document,
        draftRevision: sql`${stories.draftRevision} + 1`,
        draftUpdatedAt: now,
        updatedAt: now,
      })
      .where(and(eq(stories.id, id), eq(stories.draftRevision, expectedRevision)))
      .returning({ revision: stories.draftRevision, updatedAt: stories.draftUpdatedAt });
    return row ?? null;
  }

  async updateMeta(id: string, meta: StoryMeta, document: Story): Promise<void> {
    await this.db
      .update(stories)
      .set({
        title: meta.title,
        tagline: meta.tagline,
        synopsis: meta.synopsis,
        language: meta.language,
        genres: meta.genres,
        tags: meta.tags,
        ageRating: meta.ageRating,
        contentWarnings: meta.contentWarnings,
        access: meta.access,
        priceCents: meta.access === 'paid' ? meta.priceCents : null,
        license: meta.license,
        aiUsage: meta.aiUsage,
        coverUrl: meta.coverUrl,
        draft: document,
        draftRevision: sql`${stories.draftRevision} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(stories.id, id));
  }

  async versions(storyId: string): Promise<VersionRecord[]> {
    return this.db
      .select({
        id: storyVersions.id,
        number: storyVersions.number,
        changelog: storyVersions.changelog,
        publishedAt: storyVersions.publishedAt,
        checksum: storyVersions.checksum,
      })
      .from(storyVersions)
      .where(eq(storyVersions.storyId, storyId))
      .orderBy(desc(storyVersions.number));
  }

  /** Crée une version immuable et la rend courante, atomiquement. */
  async publishVersion(storyId: string, version: NewVersion): Promise<VersionRecord> {
    return this.db.transaction(async (tx) => {
      // Verrou de ligne : deux publications simultanées ne peuvent pas prendre le même numéro.
      await tx
        .select({ id: stories.id })
        .from(stories)
        .where(eq(stories.id, storyId))
        .for('update');
      const [last] = await tx
        .select({ number: max(storyVersions.number) })
        .from(storyVersions)
        .where(eq(storyVersions.storyId, storyId));
      const [created] = await tx
        .insert(storyVersions)
        .values({
          storyId,
          number: (last?.number ?? 0) + 1,
          document: version.document,
          checksum: version.checksum,
          stats: version.stats,
          changelog: version.changelog,
          publishedBy: version.publishedBy,
        })
        .returning({
          id: storyVersions.id,
          number: storyVersions.number,
          changelog: storyVersions.changelog,
          publishedAt: storyVersions.publishedAt,
          checksum: storyVersions.checksum,
        });
      const record = created as VersionRecord;
      await tx
        .update(stories)
        .set({
          publishedVersionId: record.id,
          status: version.visibility === 'public' ? 'published' : 'unlisted',
          firstPublishedAt: sql`coalesce(${stories.firstPublishedAt}, now())`,
          updatedAt: new Date(),
        })
        .where(eq(stories.id, storyId));
      return record;
    });
  }

  async setStatus(id: string, status: StoryRecord['status']): Promise<void> {
    await this.db.update(stories).set({ status, updatedAt: new Date() }).where(eq(stories.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(stories).where(eq(stories.id, id));
  }
}
