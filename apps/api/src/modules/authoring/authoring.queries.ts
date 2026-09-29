import type { Feedback, StoryAnalytics } from '@dedale/contracts';
import type { Story } from '@dedale/engine';
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';
import type { Database } from '../../infrastructure/db/client';
import {
  choiceStats,
  dailyStoryStats,
  endingStats,
  feedback,
  passageStats,
  profiles,
  stories,
} from '../../infrastructure/db/schema';

/** Statistiques et retours privés destinés à l'auteur. */
export class AuthoringQueries {
  constructor(private readonly db: Database) {}

  /** Toutes les statistiques ; le service décide de ce que l'offre de l'auteur permet de voir. */
  async analytics(storyId: string, document: Story): Promise<Omit<StoryAnalytics, 'advanced'>> {
    const since = new Date(Date.now() - 29 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const [[story], passages, choices, endings, daily] = await Promise.all([
      this.db
        .select({
          reads: stories.readsCount,
          completions: stories.completionsCount,
          ratingSum: stories.ratingSum,
          ratingCount: stories.ratingCount,
        })
        .from(stories)
        .where(eq(stories.id, storyId)),
      this.db
        .select({ passageId: passageStats.passageId, visits: passageStats.visits })
        .from(passageStats)
        .where(eq(passageStats.storyId, storyId)),
      this.db
        .select({
          passageId: choiceStats.passageId,
          choiceId: choiceStats.choiceId,
          count: choiceStats.count,
        })
        .from(choiceStats)
        .where(eq(choiceStats.storyId, storyId)),
      this.db
        .select({ passageId: endingStats.passageId, count: endingStats.count })
        .from(endingStats)
        .where(eq(endingStats.storyId, storyId)),
      this.db
        .select({
          day: dailyStoryStats.day,
          starts: dailyStoryStats.starts,
          completions: dailyStoryStats.completions,
        })
        .from(dailyStoryStats)
        .where(and(eq(dailyStoryStats.storyId, storyId), gte(dailyStoryStats.day, since)))
        .orderBy(asc(dailyStoryStats.day)),
    ]);

    const endingCounts = new Map(endings.map((row) => [row.passageId, row.count]));
    const starts = story?.reads ?? 0;
    const completions = story?.completions ?? 0;
    const byDay = new Map(daily.map((row) => [row.day, row]));
    const days: StoryAnalytics['daily'] = [];
    for (let offset = 29; offset >= 0; offset--) {
      const date = new Date(Date.now() - offset * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const row = byDay.get(date);
      days.push({ date, starts: row?.starts ?? 0, completions: row?.completions ?? 0 });
    }

    return {
      readers: starts,
      starts,
      completions,
      completionRate: starts === 0 ? 0 : Math.min(1, completions / starts),
      rating: {
        average: story?.ratingCount ? story.ratingSum / story.ratingCount : null,
        count: story?.ratingCount ?? 0,
      },
      passages,
      choices,
      endings: document.passages
        .filter((passage) => passage.ending)
        .map((passage) => ({
          passageId: passage.id,
          title: passage.ending?.title ?? passage.title,
          kind: passage.ending?.kind ?? 'neutral',
          count: endingCounts.get(passage.id) ?? 0,
        })),
      daily: days,
    };
  }

  async feedback(storyId: string): Promise<Feedback[]> {
    const rows = await this.db
      .select({
        id: feedback.id,
        kind: feedback.kind,
        body: feedback.body,
        passageId: feedback.passageId,
        status: feedback.status,
        createdAt: feedback.createdAt,
        handle: profiles.handle,
        displayName: profiles.displayName,
      })
      .from(feedback)
      .leftJoin(profiles, eq(profiles.userId, feedback.userId))
      .where(eq(feedback.storyId, storyId))
      .orderBy(sql`${feedback.status} = 'resolved'`, desc(feedback.createdAt))
      .limit(200);
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      body: row.body,
      passageId: row.passageId,
      status: row.status,
      author: row.handle
        ? { handle: row.handle, displayName: row.displayName ?? row.handle }
        : null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async feedbackStory(feedbackId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ storyId: feedback.storyId })
      .from(feedback)
      .where(eq(feedback.id, feedbackId));
    return row?.storyId ?? null;
  }

  async resolveFeedback(feedbackId: string): Promise<void> {
    await this.db.update(feedback).set({ status: 'resolved' }).where(eq(feedback.id, feedbackId));
  }
}
