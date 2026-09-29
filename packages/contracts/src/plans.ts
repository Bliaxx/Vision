import { z } from 'zod';

/**
 * Offres Dédale — nommées d'après le mythe : on s'y promène, on l'explore,
 * on en devient l'architecte.
 */
export const PLANS = ['wanderer', 'explorer', 'family', 'architect', 'studio'] as const;
export const PlanSchema = z.enum(PLANS);
export type Plan = z.infer<typeof PlanSchema>;

export const BillingIntervalSchema = z.enum(['month', 'year']);
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;

export const ENTITLEMENTS = [
  /** Accès au catalogue premium (lecture illimitée). */
  'premium_catalog',
  /** Pas de publicité (aucune pub n'interrompt jamais la lecture, quel que soit le plan). */
  'ad_free',
  /** Téléchargements hors ligne illimités (mobile). */
  'unlimited_offline',
  /** Profils enfants avec portail jeunesse filtré. */
  'family_profiles',
  /** Statistiques avancées pour les auteurs (entonnoirs, cartes de chaleur). */
  'author_analytics',
  /** Muse, l'assistante d'écriture IA. */
  'muse',
  /** Publication privée (lien secret, bêta-lecteurs). */
  'private_publishing',
  /** Export livre-jeu papier (impression à la demande). */
  'print_export',
  /** Espaces multi-auteurs, marque blanche, API partenaire. */
  'studio_workspace',
] as const;
export const EntitlementSchema = z.enum(ENTITLEMENTS);
export type Entitlement = z.infer<typeof EntitlementSchema>;

export interface PlanDefinition {
  readonly id: Plan;
  /** Prix en centimes d'euro ; `null` = sur devis. */
  readonly monthly: number | null;
  readonly yearly: number | null;
  readonly entitlements: readonly Entitlement[];
  /** Téléchargements hors ligne simultanés. */
  readonly offlineSlots: number;
  readonly audience: 'reader' | 'author' | 'organization';
  readonly highlighted?: boolean;
}

export const PLAN_CATALOG: Readonly<Record<Plan, PlanDefinition>> = {
  wanderer: {
    id: 'wanderer',
    monthly: 0,
    yearly: 0,
    entitlements: ['ad_free'],
    offlineSlots: 3,
    audience: 'reader',
  },
  explorer: {
    id: 'explorer',
    monthly: 599,
    yearly: 4900,
    entitlements: ['premium_catalog', 'ad_free', 'unlimited_offline'],
    offlineSlots: Number.POSITIVE_INFINITY,
    audience: 'reader',
    highlighted: true,
  },
  family: {
    id: 'family',
    monthly: 899,
    yearly: 7900,
    entitlements: ['premium_catalog', 'ad_free', 'unlimited_offline', 'family_profiles'],
    offlineSlots: Number.POSITIVE_INFINITY,
    audience: 'reader',
  },
  architect: {
    id: 'architect',
    monthly: 799,
    yearly: 6900,
    entitlements: [
      'premium_catalog',
      'ad_free',
      'unlimited_offline',
      'author_analytics',
      'muse',
      'private_publishing',
      'print_export',
    ],
    offlineSlots: Number.POSITIVE_INFINITY,
    audience: 'author',
  },
  studio: {
    id: 'studio',
    monthly: null,
    yearly: null,
    entitlements: [...ENTITLEMENTS],
    offlineSlots: Number.POSITIVE_INFINITY,
    audience: 'organization',
  },
};

export function entitlementsOf(plan: Plan): ReadonlySet<Entitlement> {
  return new Set(PLAN_CATALOG[plan].entitlements);
}

/**
 * Partage des revenus des ventes à l'unité. Le taux auteur augmente pour les
 * premiers revenus (programme « Premier fil ») afin de faire émerger les
 * nouveaux talents, et les pourboires sont reversés à 95 %.
 */
export const REVENUE_SHARE = {
  /** Part auteur standard sur une vente. */
  sale: 0.7,
  /** Part auteur tant que ses revenus cumulés restent sous le seuil. */
  firstThread: 0.85,
  firstThreadThresholdCents: 1_000_000,
  /** Part auteur sur les pourboires (« plumes »). */
  tip: 0.95,
  /** Part des abonnements Explorateur/Famille redistribuée aux auteurs. */
  subscriptionPool: 0.5,
} as const;

/** Part auteur d'une vente, selon ses revenus déjà cumulés. */
export function authorShareCents(amountCents: number, lifetimeEarningsCents: number): number {
  const threshold = REVENUE_SHARE.firstThreadThresholdCents;
  const boosted = Math.max(0, Math.min(amountCents, threshold - lifetimeEarningsCents));
  const standard = amountCents - boosted;
  return Math.round(boosted * REVENUE_SHARE.firstThread + standard * REVENUE_SHARE.sale);
}
