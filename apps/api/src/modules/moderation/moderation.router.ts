import { os, requireModerator } from '../../http/orpc';
import type { ModerationService } from './moderation.service';

export function moderationRouter(service: ModerationService) {
  return {
    queue: os.moderation.queue
      .use(requireModerator)
      .handler(({ input }) => service.queue(input.status, input.cursor, input.limit)),
    resolve: os.moderation.resolve.use(requireModerator).handler(async ({ input, context }) => {
      await service.resolve(context.user, input);
      return { ok: true as const };
    }),
  };
}
