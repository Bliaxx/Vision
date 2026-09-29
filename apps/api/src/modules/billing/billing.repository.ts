import type { Plan } from '@dedale/contracts';
import { and, eq, sum } from 'drizzle-orm';
import type { Database } from '../../infrastructure/db/client';
import { ledgerEntries, purchases, subscriptions } from '../../infrastructure/db/schema';

export interface LedgerEntryInput {
  authorId: string;
  storyId: string | null;
  kind: 'sale' | 'tip' | 'pool' | 'payout' | 'refund';
  grossCents: number;
  authorCents: number;
  sourceRef: string;
}

/** Persistance des droits achetés, abonnements et du grand livre auteurs. */
export class BillingRepository {
  constructor(private readonly db: Database) {}

  async hasPurchased(userId: string, storyId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: purchases.id })
      .from(purchases)
      .where(
        and(
          eq(purchases.userId, userId),
          eq(purchases.storyId, storyId),
          eq(purchases.status, 'paid'),
        ),
      )
      .limit(1);
    return row !== undefined;
  }

  async recordPurchase(input: {
    userId: string;
    storyId: string;
    amountCents: number;
    provider: string;
    providerRef: string;
  }): Promise<boolean> {
    const rows = await this.db
      .insert(purchases)
      .values(input)
      .onConflictDoNothing({ target: purchases.providerRef })
      .returning({ id: purchases.id });
    return rows.length > 0;
  }

  async setSubscription(input: {
    userId: string;
    plan: Plan;
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    interval: 'month' | 'year' | null;
    provider: 'stripe' | 'apple' | 'google' | 'manual';
    providerCustomerId?: string | null;
    providerSubscriptionId?: string | null;
    currentPeriodEnd: Date | null;
  }): Promise<void> {
    const values = {
      plan: input.plan,
      status: input.status,
      interval: input.interval,
      provider: input.provider,
      providerCustomerId: input.providerCustomerId ?? null,
      providerSubscriptionId: input.providerSubscriptionId ?? null,
      currentPeriodEnd: input.currentPeriodEnd,
      updatedAt: new Date(),
    };
    await this.db
      .insert(subscriptions)
      .values({ userId: input.userId, ...values })
      .onConflictDoUpdate({ target: subscriptions.userId, set: values });
  }

  async findUserBySubscription(providerSubscriptionId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId));
    return row?.userId ?? null;
  }

  async customerId(userId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: subscriptions.providerCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return row?.id ?? null;
  }

  async lifetimeEarnings(authorId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: sum(ledgerEntries.authorCents) })
      .from(ledgerEntries)
      .where(and(eq(ledgerEntries.authorId, authorId), eq(ledgerEntries.kind, 'sale')));
    return Number(row?.total ?? 0);
  }

  /** Écriture idempotente (clé `sourceRef`) : un webhook rejoué ne double rien. */
  async recordLedgerEntry(entry: LedgerEntryInput): Promise<void> {
    await this.db
      .insert(ledgerEntries)
      .values({ ...entry, platformCents: entry.grossCents - entry.authorCents })
      .onConflictDoNothing({ target: ledgerEntries.sourceRef });
  }
}
