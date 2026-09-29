import { os, requireUser } from '../../http/orpc';
import type { AuthoringService } from './authoring.service';

const OK = { ok: true } as const;

export function authoringRouter(service: AuthoringService) {
  const authed = os.authoring;
  return {
    list: authed.list.use(requireUser).handler(({ context }) => service.list(context.user)),
    create: authed.create
      .use(requireUser)
      .handler(({ context, input }) => service.create(context.user, input)),
    get: authed.get
      .use(requireUser)
      .handler(({ context, input }) => service.get(context.user, input.id)),
    saveDraft: authed.saveDraft
      .use(requireUser)
      .handler(({ context, input }) => service.saveDraft(context.user, input)),
    updateMeta: authed.updateMeta
      .use(requireUser)
      .handler(({ context, input }) => service.updateMeta(context.user, input.id, input.meta)),
    publish: authed.publish
      .use(requireUser)
      .handler(({ context, input }) => service.publish(context.user, input)),
    unpublish: authed.unpublish.use(requireUser).handler(async ({ context, input }) => {
      await service.unpublish(context.user, input.id);
      return OK;
    }),
    remove: authed.remove.use(requireUser).handler(async ({ context, input }) => {
      await service.remove(context.user, input.id);
      return OK;
    }),
    importTwee: authed.importTwee
      .use(requireUser)
      .handler(({ context, input }) => service.importTwee(context.user, input)),
    exportGamebook: authed.exportGamebook
      .use(requireUser)
      .handler(({ context, input }) => service.exportGamebook(context.user, input.id)),
    analytics: authed.analytics
      .use(requireUser)
      .handler(({ context, input }) => service.analytics(context.user, input.id)),
    feedback: authed.feedback
      .use(requireUser)
      .handler(({ context, input }) => service.feedback(context.user, input.id)),
    resolveFeedback: authed.resolveFeedback.use(requireUser).handler(async ({ context, input }) => {
      await service.resolveFeedback(context.user, input.id);
      return OK;
    }),
  };
}
