import type { Plan, Profile } from '@dedale/contracts';
import { and, eq, ne } from 'drizzle-orm';
import type { Database } from '../../infrastructure/db/client';
import { profiles, subscriptions, user } from '../../infrastructure/db/schema';

export interface SubscriptionState {
  plan: Plan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  interval: 'month' | 'year' | null;
  renewsAt: Date | null;
}

export interface AccountRecord {
  id: string;
  email: string;
  name: string;
  role: 'reader' | 'author' | 'moderator' | 'admin';
  locale: string;
}

/** Accès aux comptes, profils publics et abonnements. */
export class AccountRepository {
  constructor(private readonly db: Database) {}

  async findAccount(userId: string): Promise<AccountRecord | null> {
    const [row] = await this.db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        locale: user.locale,
      })
      .from(user)
      .where(eq(user.id, userId));
    return row ?? null;
  }

  async findProfile(userId: string): Promise<Profile | null> {
    const [row] = await this.db
      .select({
        handle: profiles.handle,
        displayName: profiles.displayName,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
        links: profiles.links,
        locale: user.locale,
      })
      .from(profiles)
      .innerJoin(user, eq(user.id, profiles.userId))
      .where(eq(profiles.userId, userId));
    if (!row) return null;
    return { ...row, locale: row.locale === 'en' ? 'en' : 'fr' };
  }

  async isHandleTaken(handle: string, exceptUserId?: string): Promise<boolean> {
    const [row] = await this.db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(
        exceptUserId
          ? and(eq(profiles.handle, handle), ne(profiles.userId, exceptUserId))
          : eq(profiles.handle, handle),
      )
      .limit(1);
    return row !== undefined;
  }

  async createProfile(input: {
    userId: string;
    handle: string;
    displayName: string;
  }): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(profiles).values(input).onConflictDoNothing();
      await tx
        .insert(subscriptions)
        .values({ userId: input.userId, plan: 'wanderer', status: 'active' })
        .onConflictDoNothing();
    });
  }

  async updateProfile(
    userId: string,
    patch: Partial<Pick<Profile, 'handle' | 'displayName' | 'bio' | 'links' | 'locale'>>,
  ): Promise<void> {
    const { locale, ...profilePatch } = patch;
    await this.db.transaction(async (tx) => {
      if (Object.keys(profilePatch).length > 0) {
        await tx
          .update(profiles)
          .set({ ...profilePatch, updatedAt: new Date() })
          .where(eq(profiles.userId, userId));
      }
      if (locale) await tx.update(user).set({ locale }).where(eq(user.id, userId));
    });
  }

  async findSubscription(userId: string): Promise<SubscriptionState> {
    const [row] = await this.db
      .select({
        plan: subscriptions.plan,
        status: subscriptions.status,
        interval: subscriptions.interval,
        renewsAt: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return row ?? { plan: 'wanderer', status: 'active', interval: null, renewsAt: null };
  }

  async promoteToAuthor(userId: string): Promise<void> {
    await this.db
      .update(user)
      .set({ role: 'author' })
      .where(and(eq(user.id, userId), eq(user.role, 'reader')));
  }
}
