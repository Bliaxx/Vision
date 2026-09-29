import { describe, expect, it } from 'vitest';
import {
  authorShareCents,
  CatalogQuerySchema,
  CheckoutInputSchema,
  contract,
  entitlementsOf,
  isAgeRatingAllowed,
  PLAN_CATALOG,
  StoryMetaSchema,
} from '../src';

describe('contrat', () => {
  it('déclare une route OpenAPI unique pour chaque procédure', () => {
    const routes = new Set<string>();
    for (const [namespace, procedures] of Object.entries(contract)) {
      for (const [name, procedure] of Object.entries(procedures)) {
        const route = (procedure as { '~orpc': { route: { method?: string; path?: string } } })[
          '~orpc'
        ].route;
        expect(route.path, `${namespace}.${name}`).toMatch(/^\//);
        const key = `${route.method} ${route.path}`;
        expect(routes.has(key), key).toBe(false);
        routes.add(key);
      }
    }
    expect(routes.size).toBeGreaterThan(30);
  });

  it('convertit les paramètres de requête', () => {
    expect(CatalogQuerySchema.parse({ limit: '12', genre: 'fantasy' })).toMatchObject({
      limit: 12,
      sort: 'trending',
    });
    expect(CatalogQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });

  it('valide les métadonnées d’un récit', () => {
    const meta = {
      title: 'Le Phare',
      tagline: null,
      synopsis: '',
      language: 'fr',
      genres: ['fantasy'],
      tags: [],
      ageRating: 'all',
      contentWarnings: [],
      access: 'free',
      priceCents: null,
      license: 'cc-by',
      aiUsage: 'none',
      coverUrl: null,
    };
    expect(StoryMetaSchema.safeParse(meta).success).toBe(true);
    expect(StoryMetaSchema.safeParse({ ...meta, genres: [] }).success).toBe(false);
    expect(StoryMetaSchema.safeParse({ ...meta, priceCents: 10 }).success).toBe(false);
  });

  it('distingue les types de paiement', () => {
    expect(
      CheckoutInputSchema.safeParse({ kind: 'subscription', plan: 'wanderer', interval: 'month' })
        .success,
    ).toBe(false);
    expect(
      CheckoutInputSchema.safeParse({
        kind: 'tip',
        storyId: '0190a4b2-7c1e-7d2a-9b3c-4d5e6f708192',
        amountCents: 200,
      }).success,
    ).toBe(true);
  });
});

describe('règles métier partagées', () => {
  it('filtre par âge', () => {
    expect(isAgeRatingAllowed('all', '10')).toBe(true);
    expect(isAgeRatingAllowed('13', '10')).toBe(false);
    expect(isAgeRatingAllowed('16', '16')).toBe(true);
  });

  it('calcule la part auteur avec le programme Premier fil', () => {
    expect(authorShareCents(1000, 0)).toBe(850);
    expect(authorShareCents(1000, 2_000_000)).toBe(700);
    // À cheval sur le seuil : 500 à 85 % + 500 à 70 %.
    expect(authorShareCents(1000, 999_500)).toBe(775);
  });

  it('décrit des offres cohérentes', () => {
    expect(entitlementsOf('explorer').has('premium_catalog')).toBe(true);
    expect(entitlementsOf('wanderer').has('premium_catalog')).toBe(false);
    expect(entitlementsOf('architect').has('muse')).toBe(true);
    expect(PLAN_CATALOG.explorer.yearly).toBeLessThan((PLAN_CATALOG.explorer.monthly ?? 0) * 12);
  });
});
