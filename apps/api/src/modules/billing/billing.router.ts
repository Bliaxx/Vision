import { os, requireUser } from '../../http/orpc';
import type { BillingService } from './billing.service';

export function billingRouter(service: BillingService) {
  return {
    plans: os.billing.plans.handler(() => service.plans()),
    checkout: os.billing.checkout
      .use(requireUser)
      .handler(({ input, context }) => service.checkout(context.user, input)),
    portal: os.billing.portal
      .use(requireUser)
      .handler(({ context }) => service.portal(context.user)),
  };
}
