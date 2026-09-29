import { entitlementsOf } from '@dedale/contracts';
import { describe, expect, it } from 'vitest';
import type { Viewer } from '../src/http/context';
import { effectivePlan } from '../src/modules/account/account.service';
import { readingAccess } from '../src/modules/billing/entitlement.policy';
import { decodeCursor, encodeCursor } from '../src/shared/cursor';
import { uuidv7 } from '../src/shared/ids';
import { MemoryRateLimiter } from '../src/shared/rate-limiter';
import { slugify, toHandle } from '../src/shared/slug';

const viewer = (overrides: Partial<Viewer> = {}): Viewer => ({
  id: 'u1',
  email: 'a@b.c',
  name: 'A',
  role: 'reader',
  plan: 'wanderer',
  entitlements: entitlementsOf('wanderer'),
  ...overrides,
});

describe("règle d'accès à la lecture", () => {
  const story = { authorId: 'author', access: 'free' as const, status: 'published' as const };

  it('laisse lire les récits gratuits, même sans compte', () => {
    expect(readingAccess(story, null, false)).toEqual({ canRead: true, reason: 'free' });
  });

  it('réserve le premium aux abonnés et le payant aux acheteurs', () => {
    const premium = { ...story, access: 'premium' as const };
    expect(readingAccess(premium, viewer(), false).reason).toBe('locked_premium');
    const explorer = viewer({ plan: 'explorer', entitlements: entitlementsOf('explorer') });
    expect(readingAccess(premium, explorer, false).reason).toBe('premium');
    const paid = { ...story, access: 'paid' as const };
    expect(readingAccess(paid, explorer, false).reason).toBe('locked_paid');
    expect(readingAccess(paid, explorer, true).reason).toBe('purchased');
  });

  it("donne toujours accès à l'auteur et à la modération", () => {
    const draft = { ...story, status: 'draft' as const, access: 'paid' as const };
    expect(readingAccess(draft, viewer({ id: 'author' }), false).reason).toBe('author');
    expect(readingAccess(draft, viewer({ role: 'moderator' }), false).reason).toBe('author');
    expect(readingAccess(draft, viewer(), false).reason).toBe('unavailable');
    expect(readingAccess({ ...story, status: 'archived' }, null, false).canRead).toBe(true);
    expect(readingAccess({ ...story, status: 'suspended' }, null, false).canRead).toBe(false);
  });
});

describe('offre effective', () => {
  it('retombe sur l’offre gratuite en cas d’impayé ou d’expiration', () => {
    const now = new Date('2026-06-01');
    expect(
      effectivePlan(
        { plan: 'explorer', status: 'active', interval: 'month', renewsAt: new Date('2026-07-01') },
        now,
      ),
    ).toBe('explorer');
    expect(
      effectivePlan(
        { plan: 'explorer', status: 'past_due', interval: 'month', renewsAt: null },
        now,
      ),
    ).toBe('wanderer');
    expect(
      effectivePlan(
        { plan: 'explorer', status: 'active', interval: 'month', renewsAt: new Date('2026-05-01') },
        now,
      ),
    ).toBe('wanderer');
  });
});

describe('utilitaires', () => {
  it('génère des UUID v7 ordonnés dans le temps', () => {
    const first = uuidv7(1_000);
    const second = uuidv7(2_000);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(first < second).toBe(true);
  });

  it('produit des slugs et identifiants lisibles', () => {
    expect(slugify("L'Île aux Trésors !")).toBe('lile-aux-tresors');
    expect(slugify('???')).toBe('recit');
    expect(toHandle('Aurore Delsol')).toBe('aurore_delsol');
    expect(toHandle('Al')).toBe('lecteur_al');
  });

  it('encode des curseurs opaques et tolérants', () => {
    expect(decodeCursor(encodeCursor(40))).toBe(40);
    expect(decodeCursor('nimporte-quoi')).toBe(0);
    expect(decodeCursor(undefined)).toBe(0);
  });

  it('limite le débit par clé', () => {
    const limiter = new MemoryRateLimiter();
    expect(limiter.consume('k', 2, 1000, 0)).toBe(true);
    expect(limiter.consume('k', 2, 1000, 10)).toBe(true);
    expect(limiter.consume('k', 2, 1000, 20)).toBe(false);
    expect(limiter.consume('k', 2, 1000, 1_500)).toBe(true);
  });
});
