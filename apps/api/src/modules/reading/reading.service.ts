import type {
  ChoiceStats,
  EndingsCodex,
  Library,
  ReadingEvent,
  ReadingPackage,
  SaveRecord,
  SaveSlot,
} from '@dedale/contracts';
import { restoreSession, type SaveData } from '@dedale/engine';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { Viewer } from '../../http/context';
import type { Database } from '../../infrastructure/db/client';
import { endingsDiscovered, favorites, saves, stories } from '../../infrastructure/db/schema';
import {
  NotFoundError,
  PaymentRequiredError,
  RateLimitedError,
  UnprocessableError,
} from '../../shared/errors';
import type { RateLimiter } from '../../shared/rate-limiter';
import type { BillingRepository } from '../billing/billing.repository';
import { readingAccess } from '../billing/entitlement.policy';
import { cardQuery, toStoryCard } from '../catalog/story-card';
import type { ReadingRepository, SaveRow, StatIncrements } from './reading.repository';
import type { StoryAccessInfo, StoryLookup } from './story-lookup';
import type { VersionCache } from './version-cache';

/** Cas d'usage de la lecture. */
export class ReadingService {
  constructor(
    private readonly db: Database,
    private readonly lookup: StoryLookup,
    private readonly versions: VersionCache,
    private readonly repository: ReadingRepository,
    private readonly billing: BillingRepository,
    private readonly limiter: RateLimiter,
  ) {}

  private async assertReadable(story: StoryAccessInfo, viewer: Viewer | null): Promise<void> {
    const purchased = viewer ? await this.billing.hasPurchased(viewer.id, story.id) : false;
    const access = readingAccess(story, viewer, purchased);
    if (access.canRead) return;
    if (access.reason === 'unavailable') throw new NotFoundError('récit introuvable');
    throw new PaymentRequiredError(
      access.reason === 'locked_premium'
        ? 'ce récit fait partie du catalogue Explorateur'
        : 'ce récit est vendu à l’unité',
    );
  }

  private async toSaveRecord(row: SaveRow): Promise<SaveRecord> {
    const version = await this.versions.get(row.versionId);
    return {
      id: row.id,
      storyId: row.storyId,
      versionId: row.versionId,
      slot: row.slot,
      data: row.data,
      passageId: row.passageId,
      passageTitle: version?.compiled.passages.get(row.passageId)?.title ?? row.passageId,
      status: row.status,
      endingPassageId: row.endingPassageId,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async open(slug: string, viewer: Viewer | null): Promise<ReadingPackage> {
    const story = await this.lookup.bySlug(slug);
    if (!story?.publishedVersionId) throw new NotFoundError('récit introuvable');
    await this.assertReadable(story, viewer);
    const version = await this.versions.get(story.publishedVersionId);
    if (!version) throw new NotFoundError('version introuvable');

    const [saveRows, discovered] = viewer
      ? await Promise.all([
          this.repository.listSaves(viewer.id, story.id),
          this.repository.discoveredEndings(viewer.id, story.id),
        ])
      : [[], []];

    return {
      storyId: story.id,
      slug: story.slug,
      title: story.title,
      coverUrl: story.coverUrl,
      author: story.author,
      version: {
        id: version.id,
        number: version.number,
        publishedAt: version.publishedAt.toISOString(),
      },
      document: version.document,
      saves: await Promise.all(saveRows.map((row) => this.toSaveRecord(row))),
      discoveredEndings: discovered.map((ending) => ending.passageId),
    };
  }

  /**
   * Enregistre une partie. Le serveur ne fait pas confiance au client : il
   * rejoue le journal d'actions contre la version publiée et en déduit lui-même
   * le passage courant et la fin éventuelle (impossible de s'attribuer une fin).
   */
  async saveProgress(
    viewer: Viewer,
    input: { storyId: string; versionId: string; slot: SaveSlot; data: SaveData },
  ): Promise<SaveRecord> {
    const version = await this.versions.get(input.versionId);
    if (!version || version.storyId !== input.storyId)
      throw new NotFoundError('version introuvable');
    const story = await this.lookup.byId(input.storyId);
    if (!story) throw new NotFoundError('récit introuvable');
    await this.assertReadable(story, viewer);

    const restored = restoreSession(version.compiled, input.data);
    if (!restored.ok) throw new UnprocessableError(`sauvegarde refusée : ${restored.detail}`);
    const { state } = restored.session;

    const row = await this.repository.upsertSave({
      userId: viewer.id,
      storyId: input.storyId,
      versionId: input.versionId,
      slot: input.slot,
      data: input.data,
      passageId: state.passage,
      status: state.status,
      endingPassageId: state.ending?.passage ?? null,
    });
    if (state.ending) {
      await this.repository.discoverEndings(viewer.id, input.storyId, [state.ending.passage]);
    }
    return this.toSaveRecord(row);
  }

  async deleteSave(viewer: Viewer, storyId: string, slot: SaveSlot): Promise<void> {
    await this.repository.deleteSave(viewer.id, storyId, slot);
  }

  /**
   * Agrège des événements de lecture anonymes. Chaque identifiant est vérifié
   * contre la version publiée : impossible d'injecter des clés arbitraires.
   */
  async track(
    input: { storyId: string; versionId: string; events: ReadingEvent[] },
    ip: string,
  ): Promise<{ accepted: number }> {
    if (!this.limiter.consume(`track:${ip}`, 120, 60_000)) {
      throw new RateLimitedError('trop d’événements');
    }
    const version = await this.versions.get(input.versionId);
    if (!version || version.storyId !== input.storyId)
      throw new NotFoundError('version introuvable');
    const { passages } = version.compiled;

    const increments: StatIncrements = {
      starts: 0,
      completions: 0,
      passages: new Map(),
      choices: new Map(),
      endings: new Map(),
    };
    let accepted = 0;
    for (const event of input.events) {
      switch (event.type) {
        case 'start':
          increments.starts++;
          accepted++;
          break;
        case 'passage':
          if (passages.has(event.passage)) {
            increments.passages.set(
              event.passage,
              (increments.passages.get(event.passage) ?? 0) + 1,
            );
            accepted++;
          }
          break;
        case 'choice': {
          const passage = passages.get(event.passage);
          if (passage?.choices.some((choice) => choice.id === event.choice)) {
            const key = `${event.passage}/${event.choice}`;
            const current = increments.choices.get(key);
            increments.choices.set(key, {
              passageId: event.passage,
              choiceId: event.choice,
              count: (current?.count ?? 0) + 1,
            });
            accepted++;
          }
          break;
        }
        case 'ending':
          if (passages.get(event.passage)?.ending) {
            increments.endings.set(event.passage, (increments.endings.get(event.passage) ?? 0) + 1);
            increments.completions++;
            accepted++;
          }
          break;
      }
    }
    if (accepted > 0) await this.repository.applyStats(input.storyId, increments);
    return { accepted };
  }

  async choiceStats(storyId: string, passageId: string): Promise<ChoiceStats> {
    const rows = await this.repository.choiceStats(storyId, passageId);
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return {
      total,
      choices: rows.map((row) => ({
        choiceId: row.choiceId,
        count: row.count,
        share: total === 0 ? 0 : Math.round((row.count / total) * 1000) / 1000,
      })),
    };
  }

  /** Codex des fins : titres masqués tant qu'elles ne sont pas découvertes. */
  async endings(storyId: string, viewer: Viewer | null): Promise<EndingsCodex> {
    const story = await this.lookup.byId(storyId);
    if (!story?.publishedVersionId) throw new NotFoundError('récit introuvable');
    const version = await this.versions.get(story.publishedVersionId);
    if (!version) throw new NotFoundError('version introuvable');
    const [counts, discovered] = await Promise.all([
      this.repository.endingStats(storyId),
      viewer ? this.repository.discoveredEndings(viewer.id, storyId) : Promise.resolve([]),
    ]);
    const total = counts.reduce((sum, row) => sum + row.count, 0);
    const countByPassage = new Map(counts.map((row) => [row.passageId, row.count]));
    const discoveredAt = new Map(discovered.map((row) => [row.passageId, row.discoveredAt]));
    const endings = version.document.passages
      .filter((passage) => passage.ending)
      .map((passage) => {
        const found = discoveredAt.get(passage.id);
        return {
          passageId: passage.id,
          kind: passage.ending?.kind ?? 'neutral',
          title: found ? (passage.ending?.title ?? passage.title) : null,
          discoveredAt: found?.toISOString() ?? null,
          rarity: total === 0 ? 0 : (countByPassage.get(passage.id) ?? 0) / total,
        };
      });
    return { total: endings.length, endings };
  }

  async library(viewer: Viewer): Promise<Library> {
    const saveRows = await this.db
      .select({
        storyId: saves.storyId,
        versionId: saves.versionId,
        status: saves.status,
        passageId: saves.passageId,
        updatedAt: saves.updatedAt,
      })
      .from(saves)
      .where(eq(saves.userId, viewer.id))
      .orderBy(desc(saves.updatedAt));
    const latest = new Map<string, (typeof saveRows)[number]>();
    for (const row of saveRows) if (!latest.has(row.storyId)) latest.set(row.storyId, row);

    const favoriteRows = await this.db
      .select({ storyId: favorites.storyId })
      .from(favorites)
      .where(eq(favorites.userId, viewer.id))
      .orderBy(desc(favorites.createdAt));

    const storyIds = [...new Set([...latest.keys(), ...favoriteRows.map((row) => row.storyId)])];
    if (storyIds.length === 0) return { inProgress: [], finished: [], favorites: [] };

    const [cards, discovered] = await Promise.all([
      cardQuery(this.db).where(inArray(stories.id, storyIds)),
      this.db
        .select({ storyId: endingsDiscovered.storyId, passageId: endingsDiscovered.passageId })
        .from(endingsDiscovered)
        .where(
          and(
            eq(endingsDiscovered.userId, viewer.id),
            inArray(endingsDiscovered.storyId, storyIds),
          ),
        ),
    ]);
    const cardById = new Map(cards.map((row) => [row.id, toStoryCard(row)]));
    const discoveredCount = new Map<string, number>();
    for (const row of discovered) {
      discoveredCount.set(row.storyId, (discoveredCount.get(row.storyId) ?? 0) + 1);
    }

    const entries = await Promise.all(
      [...latest.values()].map(async (row) => {
        const card = cardById.get(row.storyId);
        if (!card) return null;
        const version = await this.versions.get(row.versionId);
        return {
          story: card,
          status: row.status,
          passageTitle: version?.compiled.passages.get(row.passageId)?.title ?? '',
          updatedAt: row.updatedAt.toISOString(),
          endingsDiscovered: discoveredCount.get(row.storyId) ?? 0,
        };
      }),
    );
    const present = entries.filter((entry) => entry !== null);
    return {
      inProgress: present.filter((entry) => entry.status === 'playing'),
      finished: present.filter((entry) => entry.status === 'ended'),
      favorites: favoriteRows
        .map((row) => cardById.get(row.storyId))
        .filter((card) => card !== undefined),
    };
  }
}
