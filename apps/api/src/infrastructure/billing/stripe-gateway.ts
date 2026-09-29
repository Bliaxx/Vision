import type { Plan } from '@dedale/contracts';
import Stripe from 'stripe';
import type {
  BillingEvent,
  CheckoutRequest,
  CheckoutSession,
  PaymentGateway,
} from '../../modules/billing/payment-gateway';

const STATUS: Record<string, 'active' | 'trialing' | 'past_due' | 'canceled'> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  unpaid: 'past_due',
  incomplete: 'past_due',
  canceled: 'canceled',
  incomplete_expired: 'canceled',
  paused: 'canceled',
};

/**
 * Adaptateur Stripe (Checkout + portail client + webhooks signés).
 * Les prix sont transmis en `price_data` depuis le catalogue partagé des
 * offres : une seule source de vérité pour les montants.
 */
export class StripePaymentGateway implements PaymentGateway {
  readonly name = 'stripe';
  private readonly stripe: Stripe;

  constructor(
    secretKey: string,
    private readonly webhookSecret: string | undefined,
  ) {
    this.stripe = new Stripe(secretKey);
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const metadata: Record<string, string> = { userId: request.userId, kind: request.kind };
    const customer = request.customerId
      ? { customer: request.customerId }
      : { customer_email: request.email };
    if (request.kind === 'subscription') {
      metadata.plan = request.plan;
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        ...customer,
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
        allow_promotion_codes: true,
        automatic_tax: { enabled: true },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: request.amountCents,
              recurring: { interval: request.interval },
              product_data: { name: request.label },
            },
          },
        ],
        metadata,
        subscription_data: { metadata },
      });
      return { url: session.url ?? request.cancelUrl };
    }
    metadata.storyId = request.storyId;
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      ...customer,
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      automatic_tax: { enabled: true },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: request.amountCents,
            product_data: { name: request.label },
          },
        },
      ],
      metadata,
    });
    return { url: session.url ?? request.cancelUrl };
  }

  async createPortal(customerId: string, returnUrl: string) {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async parseWebhook(payload: string, signature: string | null): Promise<BillingEvent[]> {
    if (!this.webhookSecret || !signature) throw new Error('signature Stripe manquante');
    const event = await this.stripe.webhooks.constructEventAsync(
      payload,
      signature,
      this.webhookSecret,
    );
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const storyId = session.metadata?.storyId;
        if (!userId || session.payment_status !== 'paid') return [];
        if (session.mode === 'payment' && storyId) {
          const base = {
            userId,
            storyId,
            amountCents: session.amount_total ?? 0,
            ref: session.id,
            provider: 'stripe',
          };
          return [
            session.metadata?.kind === 'tip'
              ? { type: 'tip.paid', ...base }
              : { type: 'story.purchased', ...base },
          ];
        }
        return [];
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const plan = subscription.metadata?.plan as Plan | undefined;
        if (!userId || !plan) return [];
        const item = subscription.items.data[0];
        return [
          {
            type: 'subscription.updated',
            userId,
            plan,
            interval: item?.price.recurring?.interval === 'year' ? 'year' : 'month',
            status: STATUS[subscription.status] ?? 'canceled',
            periodEnd: item ? new Date(item.current_period_end * 1000) : null,
            customerId:
              typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id,
            subscriptionId: subscription.id,
            provider: 'stripe',
          },
        ];
      }
      case 'customer.subscription.deleted':
        return [{ type: 'subscription.canceled', subscriptionId: event.data.object.id }];
      default:
        return [];
    }
  }
}
