import { entitlementsOf, type Me, type Plan, type Profile } from '@dedale/contracts';
import type { Viewer } from '../../http/context';
import { ConflictError, NotFoundError } from '../../shared/errors';
import { toHandle } from '../../shared/slug';
import type { AccountRepository, SubscriptionState } from './account.repository';

/** Un abonnement impayé ou résilié retombe sur l'offre gratuite. */
export function effectivePlan(subscription: SubscriptionState, now = new Date()): Plan {
  if (subscription.status === 'canceled' || subscription.status === 'past_due') return 'wanderer';
  if (subscription.renewsAt && subscription.renewsAt < now && subscription.plan !== 'wanderer') {
    return 'wanderer';
  }
  return subscription.plan;
}

export class AccountService {
  constructor(private readonly accounts: AccountRepository) {}

  /** Crée le profil public d'un nouveau compte avec un identifiant unique. */
  async provisionAccount(user: { id: string; name: string; email: string }): Promise<void> {
    const base = toHandle(user.name || user.email.split('@')[0] || 'lecteur');
    let handle = base;
    for (let attempt = 2; await this.accounts.isHandleTaken(handle); attempt++) {
      handle = `${base.slice(0, 26)}_${attempt}`;
    }
    await this.accounts.createProfile({
      userId: user.id,
      handle,
      displayName: user.name || handle,
    });
  }

  /** Résout l'utilisateur de la requête avec son offre effective et ses droits. */
  async resolveViewer(userId: string): Promise<Viewer | null> {
    const account = await this.accounts.findAccount(userId);
    if (!account) return null;
    const plan = effectivePlan(await this.accounts.findSubscription(userId));
    return {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      plan,
      entitlements: entitlementsOf(plan),
    };
  }

  async me(viewer: Viewer): Promise<Me> {
    const [profile, subscription] = await Promise.all([
      this.accounts.findProfile(viewer.id),
      this.accounts.findSubscription(viewer.id),
    ]);
    if (!profile) throw new NotFoundError('profil introuvable');
    return {
      user: { id: viewer.id, email: viewer.email, name: viewer.name, role: viewer.role },
      profile,
      subscription: {
        plan: viewer.plan,
        status: subscription.status,
        interval: subscription.interval,
        renewsAt: subscription.renewsAt?.toISOString() ?? null,
      },
      entitlements: [...viewer.entitlements],
    };
  }

  async updateProfile(
    viewer: Viewer,
    patch: Partial<Pick<Profile, 'handle' | 'displayName' | 'bio' | 'links' | 'locale'>>,
  ): Promise<Profile> {
    if (patch.handle && (await this.accounts.isHandleTaken(patch.handle, viewer.id))) {
      throw new ConflictError('cet identifiant est déjà pris');
    }
    await this.accounts.updateProfile(viewer.id, patch);
    const profile = await this.accounts.findProfile(viewer.id);
    if (!profile) throw new NotFoundError('profil introuvable');
    return profile;
  }
}
