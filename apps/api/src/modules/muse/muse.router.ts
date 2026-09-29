import { os, requireUser } from '../../http/orpc';
import type { MuseService } from './muse.service';

export function museRouter(service: MuseService) {
  return {
    suggestChoices: os.muse.suggestChoices
      .use(requireUser)
      .handler(({ input, context }) =>
        service.suggestChoices(context.user, input.storyId, input.passageId),
      ),
    critique: os.muse.critique
      .use(requireUser)
      .handler(({ input, context }) =>
        service.critique(context.user, input.storyId, input.passageId),
      ),
  };
}
