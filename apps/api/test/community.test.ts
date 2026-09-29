import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness, publishSample, type TestClient } from './helpers/harness';

let harness: Harness;
let author: TestClient;
let reader: TestClient;
let story: Awaited<ReturnType<typeof publishSample>>;

beforeEach(async () => {
  harness ??= await createHarness();
  await harness.reset();
  author = harness.client();
  await author.signUp('Aurore Delsol', 'aurore@test.dev');
  reader = harness.client();
  await reader.signUp('Camille', 'camille@test.dev');
  story = await publishSample(author, 'le-jardin-de-mila');
});

afterAll(() => harness?.close());

describe('communauté', () => {
  it('met à jour la note moyenne à chaque avis', async () => {
    await reader.put(`/api/v1/stories/${story.id}/review`, { rating: 4, body: 'Très joli.' });
    await reader.put(`/api/v1/stories/${story.id}/review`, { rating: 2, body: 'Finalement, bof.' });
    const other = harness.client();
    await other.signUp('Jules', 'jules@test.dev');
    await other.put(`/api/v1/stories/${story.id}/review`, { rating: 5 });

    const detail = await reader.get(`/api/v1/stories/${story.slug}`);
    expect(detail.body.stats).toMatchObject({ rating: 3.5, ratingCount: 2 });
    expect(detail.body.ratingDistribution).toEqual([0, 1, 0, 0, 1]);
    expect(detail.body.viewer.myRating).toBe(2);

    const reviews = await reader.get(`/api/v1/stories/${story.id}/reviews?limit=1`);
    expect(reviews.body.items).toHaveLength(1);
    expect(reviews.body.nextCursor).not.toBeNull();

    await reader.delete(`/api/v1/stories/${story.id}/review`);
    const after = await reader.get(`/api/v1/stories/${story.slug}`);
    expect(after.body.stats).toMatchObject({ rating: 5, ratingCount: 1 });
  });

  it('interdit de noter son propre récit', async () => {
    const response = await author.put(`/api/v1/stories/${story.id}/review`, { rating: 5 });
    expect(response.status).toBe(403);
  });

  it('gère favoris et abonnements aux auteurs', async () => {
    expect((await reader.post(`/api/v1/stories/${story.id}/favorite`)).body.active).toBe(true);
    expect((await reader.post('/api/v1/authors/aurore_delsol/follow')).body.active).toBe(true);
    const detail = await reader.get(`/api/v1/stories/${story.slug}`);
    expect(detail.body.viewer).toMatchObject({ favorite: true, followingAuthor: true });
    const profile = await reader.get('/api/v1/authors/aurore_delsol');
    expect(profile.body).toMatchObject({ followers: 1, following: true, totals: { stories: 1 } });
    expect((await reader.post(`/api/v1/stories/${story.id}/favorite`)).body.active).toBe(false);
    expect((await author.post('/api/v1/authors/aurore_delsol/follow')).status).toBe(403);
  });

  it('transmet les retours privés à l’auteur', async () => {
    await reader.post(`/api/v1/stories/${story.id}/feedback`, {
      kind: 'typo',
      passageId: 'mur',
      body: 'Il manque une virgule.',
    });
    const inbox = await author.get(`/api/v1/studio/stories/${story.id}/feedback`);
    expect(inbox.body).toMatchObject([{ kind: 'typo', passageId: 'mur', status: 'open' }]);
    await author.post(`/api/v1/studio/feedback/${inbox.body[0].id}/resolve`);
    const resolved = await author.get(`/api/v1/studio/stories/${story.id}/feedback`);
    expect(resolved.body[0].status).toBe('resolved');
    expect((await reader.get(`/api/v1/studio/stories/${story.id}/feedback`)).status).toBe(403);
  });
});

describe('modération', () => {
  it('réserve la file aux modérateurs et suspend un récit signalé', async () => {
    await reader.post('/api/v1/reports', {
      targetType: 'story',
      targetId: story.id,
      reason: 'spam',
    });
    expect((await reader.get('/api/v1/moderation/reports')).status).toBe(403);

    const moderator = harness.client();
    const moderatorId = await moderator.signUp('Modo', 'modo@test.dev');
    await harness.setRole(moderatorId, 'moderator');
    const queue = await moderator.get('/api/v1/moderation/reports');
    expect(queue.body.items).toMatchObject([{ reason: 'spam', targetLabel: 'Le Jardin de Mila' }]);

    await moderator.post(`/api/v1/moderation/reports/${queue.body.items[0].id}/resolve`, {
      action: 'suspend',
    });
    expect((await harness.client().get(`/api/v1/reading/${story.slug}`)).status).toBe(404);
    const closed = await moderator.get('/api/v1/moderation/reports?status=actioned');
    expect(closed.body.items).toHaveLength(1);
  });
});

describe('sécurité', () => {
  it('rejette les écritures authentifiées venant d’une origine inconnue', async () => {
    const response = await harness.app.request(`/api/v1/stories/${story.id}/favorite`, {
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
        cookie: 'better-auth.session_token=x',
        'content-type': 'application/json',
      },
      body: '{}',
    });
    expect(response.status).toBe(403);
  });

  it('valide les entrées selon le contrat', async () => {
    const response = await reader.put(`/api/v1/stories/${story.id}/review`, { rating: 9 });
    expect(response.status).toBe(400);
  });

  it('publie la spécification OpenAPI', async () => {
    const spec = await harness.client().get('/api/v1/openapi.json');
    expect(spec.body.info.title).toBe('API Dédale');
    expect(Object.keys(spec.body.paths)).toContain('/stories/{slug}');
  });
});
