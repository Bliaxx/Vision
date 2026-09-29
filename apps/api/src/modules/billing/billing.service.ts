import {
  authorShareCents,
  type CheckoutInput,
  PLAN_CATALOG,
  REVENUE_SHARE,
} from '@dedale/contracts';
import { eq } from 'drizzle-orm';
import type { Viewer } from '../../http/context';
import type { Database } from '../../infrastructure/db/client';
import { stories } from '../../infrastructure/db/schema';
import { ForbiddenError, NotFoundError, UnprocessableError } from '../../shared/errors';
import type { Logger } from '../../shared/logger';
import type { BillingRepository } from './billing.repository';
import type { BillingEvent, CheckoutRequest, PaymentGateway } from './payment-gateway';

const PLAN_LABELS = {
  explorer: 'Dédale Explorateur',
  family: 'Dédale Famille',
  architect: 'Dédale Architecte',
} as const;

/** Offres, paiements et partage des revenus avec les auteurs. */
export class BillingService {
  constructor(
    private readonly db: Database,
    private readonly repository: BillingRepository,
    private readonly gateway: PaymentGateway,
    private readonly webUrl: string,
    private readonly logger: Logger,
  ) {}

  plans() {
    return Object.values(PLAN_CATALOG).map((plan) => ({
      id: plan.id,
      monthly: plan.monthly,
      yearly: plan.yearly,
      entitlements: [...plan.entitlements],
      audience: plan.audience,
      highlighted: plan.highlighted ?? false,
    }));
  }

  async checkout(viewer: Viewer, input: CheckoutInput): Promise<{ url: string }> {
    const base = {
      userId: viewer.id,
      email: viewer.email,
      customerId: await this.repository.customerId(viewer.id),
      cancelUrl: `${this.webUrl}/tarifs?paiement=annule`,
    };
    let request: CheckoutRequest;
    if (input.kind === 'subscription') {
      const plan = PLAN_CATALOG[input.plan];
      const amountCents = input.interval === 'year' ? plan.yearly : plan.monthly;
      if (!amountCents) throw new UnprocessableError('offre non disponible en ligne');
      request = {
        ...base,
        kind: 'subscription',
        plan: input.plan,
        interval: input.interval,
        amountCents,
        label: PLAN_LABELS[input.plan],
        successUrl: `${this.webUrl}/compte?abonnement=active`,
      };
    } else {
      const [story] = await this.db
        .select({
          id: stories.id,
          slug: stories.slug,
          title: stories.title,
          authorId: stories.authorId,
          access: stories.access,
          priceCents: stories.priceCents,
        })
        .from(stories)
        .where(eq(stories.id, input.storyId));
      if (!story) throw new NotFoundError('récit introuvable');
      if (story.authorId === viewer.id) throw new ForbiddenError('vous êtes l’auteur de ce récit');
      const successUrl = `${this.webUrl}/livre/${story.slug}?paiement=ok`;
      if (input.kind === 'story') {
        if (story.access !== 'paid' || !story.priceCents)
          throw new UnprocessableError('ce récit n’est pas en vente');
        if (await this.repository.hasPurchased(viewer.id, story.id)) {
          return { url: successUrl };
        }
        request = {
          ...base,
          kind: 'story',
          storyId: story.id,
          amountCents: story.priceCents,
          label: story.title,
          successUrl,
        };
      } else {
        request = {
          ...base,
          kind: 'tip',
          storyId: story.id,
          amountCents: input.amountCents,
          label: `Plume pour « ${story.title} »`,
          successUrl,
        };
      }
    }
    const session = await this.gateway.createCheckout(request);
    if (session.settled) await this.applyEvents(session.settled);
    return { url: session.url };
  }

  async portal(viewer: Viewer): Promise<{ url: string }> {
    const returnUrl = `${this.webUrl}/compte`;
    const customerId = await this.repository.customerId(viewer.id);
    if (!customerId) return { url: `${this.webUrl}/tarifs` };
    return this.gateway.createPortal(customerId, returnUrl);
  }

  async handleWebhook(payload: string, signature: string | null): Promise<void> {
    await this.applyEvents(await this.gateway.parseWebhook(payload, signature));
  }

  /** Applique des événements de facturation (idempotent). */
  async applyEvents(events: readonly BillingEvent[]): Promise<void> {
    for (const event of events) {
      switch (event.type) {
        case 'subscription.updated':
          await this.repository.setSubscription({
            userId: event.userId,
            plan: event.plan,
            status: event.status,
            interval: event.interval,
            provider: event.provider,
            providerCustomerId: event.customerId,
            providerSubscriptionId: event.subscriptionId,
            currentPeriodEnd: event.periodEnd,
          });
          break;
        case 'subscription.canceled': {
          const userId = await this.repository.findUserBySubscription(event.subscriptionId);
          if (userId) {
            await this.repository.setSubscription({
              userId,
              plan: 'wanderer',
              status: 'active',
              interval: null,
              provider: 'stripe',
              currentPeriodEnd: null,
            });
          }
          break;
        }
        case 'story.purchased':
        case 'tip.paid': {
          const [story] = await this.db
            .select({ authorId: stories.authorId })
            .from(stories)
            .where(eq(stories.id, event.storyId));
          if (!story) {
            this.logger.warn({ event }, 'paiement pour un récit inconnu');
            break;
          }
          if (event.type === 'story.purchased') {
            await this.repository.recordPurchase({
              userId: event.userId,
              storyId: event.storyId,
              amountCents: event.amountCents,
              provider: event.provider,
              providerRef: event.ref,
            });
          }
          const authorCents =
            event.type === 'tip.paid'
              ? Math.round(event.amountCents * REVENUE_SHARE.tip)
              : authorShareCents(
                  event.amountCents,
                  await this.repository.lifetimeEarnings(story.authorId),
                );
          await this.repository.recordLedgerEntry({
            authorId: story.authorId,
            storyId: event.storyId,
            kind: event.type === 'tip.paid' ? 'tip' : 'sale',
            grossCents: event.amountCents,
            authorCents,
            sourceRef: event.ref,
          });
          break;
        }
      }
    }
  }
}
