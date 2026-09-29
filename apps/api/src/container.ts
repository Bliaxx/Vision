import type { Env } from './config';
import { AnthropicMuse } from './infrastructure/ai/anthropic-muse';
import { OfflineMuse } from './infrastructure/ai/offline-muse';
import { createAuth } from './infrastructure/auth/auth';
import { FakePaymentGateway } from './infrastructure/billing/fake-gateway';
import { StripePaymentGateway } from './infrastructure/billing/stripe-gateway';
import { createDatabase, type DatabaseHandle } from './infrastructure/db/client';
import { AccountRepository } from './modules/account/account.repository';
import { AccountService } from './modules/account/account.service';
import { AuthoringQueries } from './modules/authoring/authoring.queries';
import { AuthoringService } from './modules/authoring/authoring.service';
import { StoryRepository } from './modules/authoring/story.repository';
import { BillingRepository } from './modules/billing/billing.repository';
import { BillingService } from './modules/billing/billing.service';
import type { PaymentGateway } from './modules/billing/payment-gateway';
import { CatalogQueries } from './modules/catalog/catalog.queries';
import { CommunityService } from './modules/community/community.service';
import { ModerationService } from './modules/moderation/moderation.service';
import type { MuseEngine } from './modules/muse/muse.port';
import { MuseService } from './modules/muse/muse.service';
import { ReadingRepository } from './modules/reading/reading.repository';
import { ReadingService } from './modules/reading/reading.service';
import { StoryLookup } from './modules/reading/story-lookup';
import { VersionCache } from './modules/reading/version-cache';
import { createLogger, type Logger } from './shared/logger';
import { MemoryRateLimiter, type RateLimiter } from './shared/rate-limiter';

export interface ContainerOverrides {
  database?: DatabaseHandle;
  payments?: PaymentGateway;
  muse?: MuseEngine;
  logger?: Logger;
}

/**
 * Racine de composition : le seul endroit qui connaît les implémentations
 * concrètes. Injection de dépendances explicite, sans conteneur magique :
 * chaque dépendance se lit dans le code et se remplace dans les tests.
 */
export function createContainer(env: Env, overrides: ContainerOverrides = {}) {
  const logger = overrides.logger ?? createLogger(env.LOG_LEVEL, env.NODE_ENV === 'development');
  const database =
    overrides.database ?? createDatabase(env.DATABASE_URL, { poolSize: env.DATABASE_POOL_SIZE });
  const { db } = database;
  const limiter: RateLimiter = new MemoryRateLimiter();

  const payments =
    overrides.payments ??
    (env.STRIPE_SECRET_KEY
      ? new StripePaymentGateway(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET)
      : new FakePaymentGateway());
  if (payments.name === 'fake' && env.NODE_ENV === 'production') {
    throw new Error('STRIPE_SECRET_KEY est requis en production');
  }
  const museEngine =
    overrides.muse ??
    (env.ANTHROPIC_API_KEY
      ? new AnthropicMuse(env.ANTHROPIC_API_KEY, env.MUSE_MODEL)
      : new OfflineMuse());

  const accounts = new AccountRepository(db);
  const accountService = new AccountService(accounts);
  const storyRepository = new StoryRepository(db);
  const authoring = new AuthoringService(storyRepository, new AuthoringQueries(db), accounts);
  const billingRepository = new BillingRepository(db);
  const versions = new VersionCache(db);

  const auth = createAuth(env, db, {
    onUserCreated: (user) => accountService.provisionAccount(user),
  });

  return {
    env,
    logger,
    database,
    auth,
    services: {
      account: accountService,
      catalog: new CatalogQueries(db),
      authoring,
      reading: new ReadingService(
        db,
        new StoryLookup(db),
        versions,
        new ReadingRepository(db),
        billingRepository,
        limiter,
      ),
      community: new CommunityService(db, limiter),
      moderation: new ModerationService(db),
      billing: new BillingService(db, billingRepository, payments, env.WEB_URL, logger),
      muse: new MuseService(authoring, museEngine, limiter),
    },
    adapters: { payments: payments.name, muse: museEngine.name },
  };
}

export type Container = ReturnType<typeof createContainer>;
