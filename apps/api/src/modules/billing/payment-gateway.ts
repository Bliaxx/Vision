import type { BillingInterval, Plan } from '@dedale/contracts';

/** Demande de paiement indépendante du prestataire. */
export type CheckoutRequest = {
  userId: string;
  email: string;
  customerId: string | null;
  successUrl: string;
  cancelUrl: string;
} & (
  | {
      kind: 'subscription';
      plan: Exclude<Plan, 'wanderer' | 'studio'>;
      interval: BillingInterval;
      amountCents: number;
      label: string;
    }
  | { kind: 'story'; storyId: string; amountCents: number; label: string }
  | { kind: 'tip'; storyId: string; amountCents: number; label: string }
);

/** Événements de facturation normalisés (quel que soit le prestataire). */
export type BillingEvent =
  | {
      type: 'subscription.updated';
      userId: string;
      plan: Plan;
      interval: BillingInterval | null;
      status: 'active' | 'trialing' | 'past_due' | 'canceled';
      periodEnd: Date | null;
      customerId: string | null;
      subscriptionId: string | null;
      provider: 'stripe' | 'apple' | 'google' | 'manual';
    }
  | { type: 'subscription.canceled'; subscriptionId: string }
  | {
      type: 'story.purchased';
      userId: string;
      storyId: string;
      amountCents: number;
      ref: string;
      provider: string;
    }
  | {
      type: 'tip.paid';
      userId: string;
      storyId: string;
      amountCents: number;
      ref: string;
      provider: string;
    };

export interface CheckoutSession {
  url: string;
  /** Événements déjà réglés (prestataire simulé en développement). */
  settled?: BillingEvent[];
}

/** Port de paiement : Stripe en production, simulation en développement. */
export interface PaymentGateway {
  readonly name: string;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  createPortal(customerId: string, returnUrl: string): Promise<{ url: string }>;
  parseWebhook(payload: string, signature: string | null): Promise<BillingEvent[]>;
}
