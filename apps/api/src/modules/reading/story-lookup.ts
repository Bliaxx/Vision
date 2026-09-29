import type { AuthorRef } from '@dedale/contracts';
import { eq, type SQL } from 'drizzle-orm';
import type { Database } from '../../infrastructure/db/client';
import { profiles, stories } from '../../infrastructure/db/schema';

export interface StoryAccessInfo {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  authorId: string;
  access: 'free' | 'premium' | 'paid';
  status: 'draft' | 'published' | 'unlisted' | 'suspended' | 'archived';
  publishedVersionId: string | null;
  author: AuthorRef;
}

/** Lecture minimale d'un récit pour les contrôles d'accès. */
export class StoryLookup {
  constructor(private readonly db: Database) {}

  private async find(where: SQL): Promise<StoryAccessInfo | null> {
    const [row] = await this.db
      .select({
        id: stories.id,
        slug: stories.slug,
        title: stories.title,
        coverUrl: stories.coverUrl,
        authorId: stories.authorId,
        access: stories.access,
        status: stories.status,
        publishedVersionId: stories.publishedVersionId,
        handle: profiles.handle,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(stories)
      .innerJoin(profiles, eq(profiles.userId, stories.authorId))
      .where(where);
    if (!row) return null;
    const { handle, displayName, avatarUrl, ...story } = row;
    return { ...story, author: { id: story.authorId, handle, displayName, avatarUrl } };
  }

  bySlug(slug: string) {
    return this.find(eq(stories.slug, slug));
  }

  byId(id: string) {
    return this.find(eq(stories.id, id));
  }
}
