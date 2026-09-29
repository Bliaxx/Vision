import type { Report } from '@dedale/contracts';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { Viewer } from '../../http/context';
import type { Database } from '../../infrastructure/db/client';
import { moderationLog, profiles, reports, reviews, stories } from '../../infrastructure/db/schema';
import { decodeCursor, paginate } from '../../shared/cursor';
import { NotFoundError } from '../../shared/errors';

/**
 * File de modération. Chaque décision est journalisée (traçabilité exigée par
 * le règlement européen sur les services numériques, DSA).
 */
export class ModerationService {
  constructor(private readonly db: Database) {}

  async queue(
    status: 'open' | 'dismissed' | 'actioned',
    cursor: string | undefined,
    limit: number,
  ) {
    const offset = decodeCursor(cursor);
    const rows = await this.db
      .select({ report: reports, reporterHandle: profiles.handle })
      .from(reports)
      .leftJoin(profiles, eq(profiles.userId, reports.reporterId))
      .where(eq(reports.status, status))
      .orderBy(status === 'open' ? asc(reports.createdAt) : desc(reports.createdAt))
      .limit(limit + 1)
      .offset(offset);
    const page = paginate(rows, offset, limit);

    const storyIds = page.items
      .filter(({ report }) => report.targetType === 'story')
      .map(({ report }) => report.targetId)
      .filter((id) => /^[0-9a-f-]{36}$/.test(id));
    const titles = storyIds.length
      ? await this.db
          .select({ id: stories.id, title: stories.title })
          .from(stories)
          .where(inArray(stories.id, storyIds))
      : [];
    const titleById = new Map(titles.map((row) => [row.id, row.title]));

    const items: Report[] = page.items.map(({ report, reporterHandle }) => ({
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      targetLabel: titleById.get(report.targetId) ?? null,
      reason: report.reason as Report['reason'],
      details: report.details,
      status: report.status,
      reporter: reporterHandle ? { handle: reporterHandle } : null,
      createdAt: report.createdAt.toISOString(),
      resolvedAt: report.resolvedAt?.toISOString() ?? null,
    }));
    return { items, nextCursor: page.nextCursor };
  }

  async resolve(
    moderator: Viewer,
    input: { id: string; action: 'dismiss' | 'hide' | 'suspend'; note: string },
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [report] = await tx
        .select()
        .from(reports)
        .where(eq(reports.id, input.id))
        .for('update');
      if (!report) throw new NotFoundError('signalement introuvable');

      if (input.action !== 'dismiss') {
        if (report.targetType === 'review') {
          await tx.update(reviews).set({ status: 'hidden' }).where(eq(reviews.id, report.targetId));
        } else if (report.targetType === 'story') {
          await tx
            .update(stories)
            .set({ status: input.action === 'suspend' ? 'suspended' : 'archived' })
            .where(eq(stories.id, report.targetId));
        }
      }
      // Tous les signalements ouverts sur la même cible sont clos ensemble.
      await tx
        .update(reports)
        .set({
          status: input.action === 'dismiss' ? 'dismissed' : 'actioned',
          resolvedBy: moderator.id,
          resolution: input.note || input.action,
          resolvedAt: new Date(),
        })
        .where(
          and(
            eq(reports.targetType, report.targetType),
            eq(reports.targetId, report.targetId),
            eq(reports.status, 'open'),
          ),
        );
      await tx.insert(moderationLog).values({
        actorId: moderator.id,
        action: input.action,
        targetType: report.targetType,
        targetId: report.targetId,
        note: input.note,
      });
    });
  }
}
