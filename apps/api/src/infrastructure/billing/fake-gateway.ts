import type {
  BillingEvent,
  CheckoutRequest,
  CheckoutSession,
  PaymentGateway,
} from '../../modules/billing/payment-gateway';
import { uuidv7 } from '../../shared/ids';

/**
 * Prestataire simulé : le paiement est réglé instantanément. Permet de
 * parcourir tout le produit en local sans compte Stripe. Interdit en production.
 */
export class FakePaymentGateway implements PaymentGateway {
  readonly name = 'fake';

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const ref = `fake_${uuidv7()}`;
    const settled: BillingEvent[] = [];
    switch (request.kind) {
      case 'subscription': {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + (request.interval === 'year' ? 12 : 1));
        settled.push({
          type: 'subscription.updated',
          userId: request.userId,
          plan: request.plan,
          interval: request.interval,
          status: 'active',
          periodEnd,
          customerId: `fake_customer_${request.userId}`,
          subscriptionId: ref,
          provider: 'manual',
        });
        break;
      }
      case 'story':
        settled.push({
          type: 'story.purchased',
          userId: request.userId,
          storyId: request.storyId,
          amountCents: request.amountCents,
          ref,
          provider: 'fake',
        });
        break;
      case 'tip':
        settled.push({
          type: 'tip.paid',
          userId: request.userId,
          storyId: request.storyId,
          amountCents: request.amountCents,
          ref,
          provider: 'fake',
        });
        break;
    }
    return { url: request.successUrl, settled };
  }

  async createPortal(_customerId: string, returnUrl: string) {
    return { url: returnUrl };
  }

  async parseWebhook(): Promise<BillingEvent[]> {
    return [];
  }
}
