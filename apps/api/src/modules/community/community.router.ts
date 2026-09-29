import { os, requireUser } from '../../http/orpc';
import type { CommunityService } from './community.service';

const OK = { ok: true } as const;

export function communityRouter(service: CommunityService) {
  const community = os.community;
  return {
    reviews: community.reviews.handler(({ input }) =>
      service.reviews(input.storyId, input.cursor, input.limit),
    ),
    upsertReview: community.upsertReview
      .use(requireUser)
      .handler(({ input, context }) => service.upsertReview(context.user, input)),
    deleteReview: community.deleteReview.use(requireUser).handler(async ({ input, context }) => {
      await service.deleteReview(context.user, input.storyId);
      return OK;
    }),
    toggleFavorite: community.toggleFavorite
      .use(requireUser)
      .handler(({ input, context }) => service.toggleFavorite(context.user, input.storyId)),
    toggleFollow: community.toggleFollow
      .use(requireUser)
      .handler(({ input, context }) => service.toggleFollow(context.user, input.handle)),
    sendFeedback: community.sendFeedback.use(requireUser).handler(async ({ input, context }) => {
      await service.sendFeedback(context.user, input);
      return OK;
    }),
    report: community.report.use(requireUser).handler(async ({ input, context }) => {
      await service.report(context.user, input);
      return OK;
    }),
  };
}
