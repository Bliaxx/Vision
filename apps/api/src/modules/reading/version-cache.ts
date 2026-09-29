import { type CompiledStory, compileStory, type Story } from '@dedale/engine';
import { eq } from 'drizzle-orm';
import type { Database } from '../../infrastructure/db/client';
import { storyVersions } from '../../infrastructure/db/schema';
import { LruCache } from '../../shared/lru';

export interface LoadedVersion {
  id: string;
  storyId: string;
  number: number;
  publishedAt: Date;
  document: Story;
  compiled: CompiledStory;
}

/**
 * Les versions publiées sont immuables : on peut les compiler une fois et les
 * garder en mémoire sans risque d'incohérence.
 */
export class VersionCache {
  private readonly cache = new LruCache<string, LoadedVersion>(256);

  constructor(private readonly db: Database) {}

  async get(versionId: string): Promise<LoadedVersion | null> {
    const cached = this.cache.get(versionId);
    if (cached) return cached;
    const [row] = await this.db
      .select({
        id: storyVersions.id,
        storyId: storyVersions.storyId,
        number: storyVersions.number,
        publishedAt: storyVersions.publishedAt,
        document: storyVersions.document,
      })
      .from(storyVersions)
      .where(eq(storyVersions.id, versionId));
    if (!row) return null;
    const loaded = { ...row, compiled: compileStory(row.document) };
    this.cache.set(versionId, loaded);
    return loaded;
  }
}
