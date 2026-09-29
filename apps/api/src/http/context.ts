import type { Entitlement, Plan, UserRole } from '@dedale/contracts';

/** Utilisateur authentifié, enrichi de son offre et de ses droits. */
export interface Viewer {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly plan: Plan;
  readonly entitlements: ReadonlySet<Entitlement>;
}

/**
 * Contexte d'une requête. La session est résolue paresseusement (une seule
 * fois) : les procédures publiques n'interrogent pas la base pour rien.
 */
export interface RequestContext {
  readonly requestId: string;
  readonly ip: string;
  readonly headers: Headers;
  readonly locale: 'fr' | 'en';
  viewer(): Promise<Viewer | null>;
}
