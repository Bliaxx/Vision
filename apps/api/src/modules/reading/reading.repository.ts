import type { SaveSlot } from '@dedale/contracts';
import type { SaveData } from '@dedale/engine';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../../infrastructure/db/client';
import {
  choiceStats,
  dailyStoryStats,
  endingStats,
  endingsDiscovered,
  passageStats,
  saves,
  stories,
} from '../../infrastructure/db/schema';

export type SaveRow = typeof saves.$inferSelect;

export interface StatIncrements {
  starts: number;
  completions: number;
  passages: Map<string, number>;
  choices: Map<string, { passageId: string; choiceId: string; count: number }>;
  endings: Map<string, number>;
}

export class ReadingRepository {
  constructor(private readonly db: Database) {}

  async listSaves(userId: string, storyId: string): Promise<SaveRow[]> {
    return this.db
      .select()
      .from(saves)
      .where(and(eq(saves.userId, userId), eq(saves.storyId, storyId)))
      .orderBy(desc(saves.updatedAt));
  }

  async upsertSave(values: {
    userId: string;
    storyId: string;
    versionId: string;
    slot: SaveSlot;
    data: SaveData;
    passageId: string;
    status: 'playing' | 'ended';
    endingPassageId: string | null;
  }): Promise<SaveRow> {
    const now = new Date();
    const [row] = await this.db
      .insert(saves)
      .values({ ...values, updatedAt: now })
      .onConflictDoUpdate({
        target: [saves.userId, saves.storyId, saves.slot],
        set: {
          versionId: values.versionId,
          data: values.data,
          passageId: values.passageId,
          status: values.status,
          endingPassageId: values.endingPassageId,
          updatedAt: now,
        },
      })
      .returning();
    return row as SaveRow;
  }

  async deleteSave(userId: string, storyId: string, slot: SaveSlot): Promise<void> {
    await this.db
      .delete(saves)
      .where(and(eq(saves.userId, userId), eq(saves.storyId, storyId), eq(saves.slot, slot)));
  }

  /** Enregistre les fins découvertes ; retourne celles qui sont nouvelles. */
  async discoverEndings(userId: string, storyId: string, passageIds: string[]): Promise<string[]> {
    if (passageIds.length === 0) return [];
    const rows = await this.db
      .insert(endingsDiscovered)
      .values(passageIds.map((passageId) => ({ userId, storyId, passageId })))
      .onConflictDoNothing()
      .returning({ passageId: endingsDiscovered.passageId });
    return rows.map((row) => row.passageId);
  }

  async discoveredEndings(
    userId: string,
    storyId: string,
  ): Promise<{ passageId: string; discoveredAt: Date }[]> {
    return this.db
      .select({
        passageId: endingsDiscovered.passageId,
        discoveredAt: endingsDiscovered.discoveredAt,
      })
      .from(endingsDiscovered)
      .where(and(eq(endingsDiscovered.userId, userId), eq(endingsDiscovered.storyId, storyId)));
  }

  /** Applique un lot d'incréments de statistiques dans une seule transaction. */
  async applyStats(storyId: string, increments: StatIncrements): Promise<void> {
    const day = new Date().toISOString().slice(0, 10);
    await this.db.transaction(async (tx) => {
      if (increments.starts > 0 || increments.completions > 0) {
        await tx
          .update(stories)
          .set({
            readsCount: sql`${stories.readsCount} + ${increments.starts}`,
            completionsCount: sql`${stories.completionsCount} + ${increments.completions}`,
            // Score de tendance : décroissance exponentielle (demi-vie ≈ 7 jours).
            trendingScore: sql`${stories.trendingScore} * exp(-extract(epoch from (now() - ${stories.trendingAt})) / 872542) + ${increments.starts}`,
            trendingAt: sql`now()`,
          })
          .where(eq(stories.id, storyId));
        await tx
          .insert(dailyStoryStats)
          .values({ storyId, day, starts: increments.starts, completions: increments.completions })
          .onConflictDoUpdate({
            target: [dailyStoryStats.storyId, dailyStoryStats.day],
            set: {
              starts: sql`${dailyStoryStats.starts} + ${increments.starts}`,
              completions: sql`${dailyStoryStats.completions} + ${increments.completions}`,
            },
          });
      }
      for (const [passageId, count] of increments.passages) {
        await tx
          .insert(passageStats)
          .values({ storyId, passageId, visits: count })
          .onConflictDoUpdate({
            target: [passageStats.storyId, passageStats.passageId],
            set: { visits: sql`${passageStats.visits} + ${count}` },
          });
      }
      for (const { passageId, choiceId, count } of increments.choices.values()) {
        await tx
          .insert(choiceStats)
          .values({ storyId, passageId, choiceId, count })
          .onConflictDoUpdate({
            target: [choiceStats.storyId, choiceStats.passageId, choiceStats.choiceId],
            set: { count: sql`${choiceStats.count} + ${count}` },
          });
      }
      for (const [passageId, count] of increments.endings) {
        await tx
          .insert(endingStats)
          .values({ storyId, passageId, count })
          .onConflictDoUpdate({
            target: [endingStats.storyId, endingStats.passageId],
            set: { count: sql`${endingStats.count} + ${count}` },
          });
      }
    });
  }

  async choiceStats(storyId: string, passageId: string) {
    return this.db
      .select({ choiceId: choiceStats.choiceId, count: choiceStats.count })
      .from(choiceStats)
      .where(and(eq(choiceStats.storyId, storyId), eq(choiceStats.passageId, passageId)));
  }

  async endingStats(storyId: string) {
    return this.db
      .select({ passageId: endingStats.passageId, count: endingStats.count })
      .from(endingStats)
      .where(eq(endingStats.storyId, storyId));
  }
}
