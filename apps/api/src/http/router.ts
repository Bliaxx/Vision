import type { Container } from '../container';
import { accountRouter } from '../modules/account/account.router';
import { authoringRouter } from '../modules/authoring/authoring.router';
import { billingRouter } from '../modules/billing/billing.router';
import { catalogRouter } from '../modules/catalog/catalog.router';
import { communityRouter } from '../modules/community/community.router';
import { moderationRouter } from '../modules/moderation/moderation.router';
import { museRouter } from '../modules/muse/muse.router';
import { readingRouter } from '../modules/reading/reading.router';
import { os } from './orpc';

/** Assemble les routeurs des modules ; `os.router` vérifie la conformité au contrat. */
export function createRouter(services: Container['services']) {
  return os.router({
    catalog: catalogRouter(services.catalog),
    reading: readingRouter(services.reading),
    authoring: authoringRouter(services.authoring),
    community: communityRouter(services.community),
    account: accountRouter(services.account),
    billing: billingRouter(services.billing),
    muse: museRouter(services.muse),
    moderation: moderationRouter(services.moderation),
  });
}

export type AppRouter = ReturnType<typeof createRouter>;
