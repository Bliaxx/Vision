import { compileStory, replay, StorySchema, toSaveData } from '@dedale/engine';
import { sampleStories } from '@dedale/samples';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness, publishSample, type TestClient } from './helpers/harness';

let harness: Harness;
let author: TestClient;
let reader: TestClient;

const phareDocument = StorySchema.parse(
  sampleStories.find((story) => story.slug === 'le-phare-des-brumes')?.document,
);

beforeEach(async () => {
  harness ??= await createHarness();
  await harness.reset();
  author = harness.client();
  await author.signUp('Aurore', 'aurore@test.dev');
  reader = harness.client();
  await reader.signUp('Camille', 'camille@test.dev');
});

afterAll(() => harness?.close());

describe('lecture', () => {
  it('ouvre un récit gratuit sans compte', async () => {
    const story = await publishSample(author, 'le-phare-des-brumes');
    const anonymous = harness.client();
    const opened = await anonymous.get(`/api/v1/reading/${story.slug}`);
    expect(opened.status).toBe(200);
    expect(opened.body.document.start).toBe('greve');
    expect(opened.body.saves).toEqual([]);
  });

  it('exige un abonnement pour le catalogue premium', async () => {
    const story = await publishSample(author, 'nuit-blanche-a-montmartre');
    expect((await reader.get(`/api/v1/reading/${story.slug}`)).status).toBe(402);
    const detail = await reader.get(`/api/v1/stories/${story.slug}`);
    expect(detail.body.entitlement).toEqual({ canRead: false, reason: 'locked_premium' });

    const checkout = await reader.post('/api/v1/billing/checkout', {
      kind: 'subscription',
      plan: 'explorer',
      interval: 'year',
    });
    expect(checkout.status).toBe(200);
    expect((await reader.get(`/api/v1/reading/${story.slug}`)).status).toBe(200);
    const me = await reader.get('/api/v1/me');
    expect(me.body.subscription).toMatchObject({ plan: 'explorer', interval: 'year' });
  });

  it('vend un récit à l’unité et crédite l’auteur (programme Premier fil)', async () => {
    const story = await publishSample(author, 'la-derniere-lettre');
    expect((await reader.get(`/api/v1/reading/${story.slug}`)).status).toBe(402);
    await reader.post('/api/v1/billing/checkout', { kind: 'story', storyId: story.id });
    expect((await reader.get(`/api/v1/reading/${story.slug}`)).status).toBe(200);
    const ledger = await harness.db.query.ledgerEntries.findMany();
    expect(ledger).toMatchObject([
      { kind: 'sale', grossCents: 299, authorCents: 254, platformCents: 45 },
    ]);
  });

  it('enregistre une partie vérifiée par rejeu et découvre les fins', async () => {
    const story = await publishSample(author, 'le-phare-des-brumes');
    const session = replay(compileStory(phareDocument), 1, [{ type: 'choose', choice: 'fuir' }]);
    const saved = await reader.put('/api/v1/reading/saves', {
      storyId: story.id,
      versionId: story.versionId,
      slot: 'auto',
      data: toSaveData(session),
    });
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({
      status: 'ended',
      endingPassageId: 'renoncement',
      passageTitle: 'Le renoncement',
    });

    const codex = await reader.get(`/api/v1/stories/${story.id}/endings`);
    const discovered = codex.body.endings.filter(
      (ending: { title: string | null }) => ending.title,
    );
    expect(discovered.map((ending: { passageId: string }) => ending.passageId)).toEqual([
      'renoncement',
    ]);
    expect(codex.body.total).toBe(5);

    const library = await reader.get('/api/v1/me/library');
    expect(library.body.finished[0].story.slug).toBe(story.slug);
  });

  it('rejette une sauvegarde falsifiée', async () => {
    const story = await publishSample(author, 'le-phare-des-brumes');
    const forged = await reader.put('/api/v1/reading/saves', {
      storyId: story.id,
      versionId: story.versionId,
      slot: 'auto',
      data: { v: 1, seed: 1, actions: [{ type: 'choose', choice: 'allumer' }] },
    });
    expect(forged.status).toBe(422);
  });

  it('agrège des statistiques de choix anonymes et valide les identifiants', async () => {
    const story = await publishSample(author, 'le-phare-des-brumes');
    const anonymous = harness.client();
    const tracked = await anonymous.post('/api/v1/reading/events', {
      storyId: story.id,
      versionId: story.versionId,
      events: [
        { type: 'start' },
        { type: 'choice', passage: 'greve', choice: 'phare' },
        { type: 'choice', passage: 'greve', choice: 'phare' },
        { type: 'choice', passage: 'greve', choice: 'cabane' },
        { type: 'choice', passage: 'greve', choice: 'inexistant' },
        { type: 'passage', passage: 'porte' },
        { type: 'ending', passage: 'greve' },
      ],
    });
    expect(tracked.body.accepted).toBe(5);
    const stats = await anonymous.get(`/api/v1/stories/${story.id}/passages/greve/choice-stats`);
    expect(stats.body.total).toBe(3);
    const phare = stats.body.choices.find(
      (choice: { choiceId: string }) => choice.choiceId === 'phare',
    );
    expect(phare).toMatchObject({ count: 2, share: 0.667 });

    const analytics = await author.get(`/api/v1/studio/stories/${story.id}/analytics`);
    expect(analytics.body.starts).toBe(1);
    expect(analytics.body.daily).toHaveLength(30);
    // Offre gratuite : indicateurs de base seulement.
    expect(analytics.body.advanced).toBe(false);
    expect(analytics.body.passages).toEqual([]);
  });
});
