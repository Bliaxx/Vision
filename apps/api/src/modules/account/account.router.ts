import { os, requireUser } from '../../http/orpc';
import type { AccountService } from './account.service';

export function accountRouter(service: AccountService) {
  return {
    me: os.account.me.use(requireUser).handler(({ context }) => service.me(context.user)),
    updateProfile: os.account.updateProfile
      .use(requireUser)
      .handler(({ context, input }) => service.updateProfile(context.user, input)),
  };
}
