import { os, requireUser } from '../../http/orpc';
import type { ReadingService } from './reading.service';

export function readingRouter(service: ReadingService) {
  return {
    open: os.reading.open.handler(async ({ input, context }) =>
      service.open(input.slug, await context.viewer()),
    ),
    saveProgress: os.reading.saveProgress
      .use(requireUser)
      .handler(({ input, context }) => service.saveProgress(context.user, input)),
    deleteSave: os.reading.deleteSave.use(requireUser).handler(async ({ input, context }) => {
      await service.deleteSave(context.user, input.storyId, input.slot);
      return { ok: true as const };
    }),
    track: os.reading.track.handler(({ input, context }) => service.track(input, context.ip)),
    choiceStats: os.reading.choiceStats.handler(({ input }) =>
      service.choiceStats(input.storyId, input.passageId),
    ),
    endings: os.reading.endings.handler(async ({ input, context }) =>
      service.endings(input.storyId, await context.viewer()),
    ),
    library: os.reading.library
      .use(requireUser)
      .handler(({ context }) => service.library(context.user)),
  };
}
