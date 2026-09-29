import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness, publishSample, type TestClient } from './helpers/harness';

let harness: Harness;
let author: TestClient;

beforeEach(async () => {
  harness ??= await createHarness();
  await harness.reset();
  author = harness.client();
  await author.signUp('Aurore Delsol', 'aurore@test.dev');
});

afterAll(() => harness?.close());

describe('studio', () => {
  it('crée un récit à partir du modèle classique et promeut le compte en auteur', async () => {
    const created = await author.post('/api/v1/studio/stories', {
      title: 'La Tour Noire',
      genres: ['fantasy'],
    });
    expect(created.status).toBe(201);
    const draft = await author.get(`/api/v1/studio/stories/${created.body.id}`);
    expect(draft.body).toMatchObject({ slug: 'la-tour-noire', status: 'draft', revision: 0 });
    expect(draft.body.document.passages.length).toBeGreaterThan(3);
    const me = await author.get('/api/v1/me');
    expect(me.body.user.role).toBe('author');
    const list = await author.get('/api/v1/studio/stories');
    expect(list.body.map((story: { title: string }) => story.title)).toEqual(['La Tour Noire']);
  });

  it('génère des slugs uniques', async () => {
    await author.post('/api/v1/studio/stories', { title: 'Écho' });
    const second = await author.post('/api/v1/studio/stories', { title: 'Écho' });
    const draft = await author.get(`/api/v1/studio/stories/${second.body.id}`);
    expect(draft.body.slug).toBe('echo-2');
  });

  it('protège le brouillon par concurrence optimiste', async () => {
    const { body } = await author.post('/api/v1/studio/stories', { title: 'Brouillon' });
    const draft = await author.get(`/api/v1/studio/stories/${body.id}`);
    const saved = await author.put(`/api/v1/studio/stories/${body.id}/draft`, {
      revision: 0,
      document: draft.body.document,
    });
    expect(saved.status).toBe(200);
    expect(saved.body.revision).toBe(1);
    expect(saved.body.analysis.publishable).toBe(true);

    const stale = await author.put(`/api/v1/studio/stories/${body.id}/draft`, {
      revision: 0,
      document: draft.body.document,
    });
    expect(stale.status).toBe(409);
    expect(stale.body).toMatchObject({ code: 'CONFLICT', data: { revision: 1 } });
  });

  it('refuse de publier un récit cassé et renvoie les diagnostics', async () => {
    const { body } = await author.post('/api/v1/studio/stories', {
      title: 'Cassé',
      template: 'blank',
    });
    const draft = await author.get(`/api/v1/studio/stories/${body.id}`);
    const document = {
      ...draft.body.document,
      passages: [
        {
          id: 'debut',
          title: 'Début',
          text: 'Texte',
          choices: [{ id: 'c1', text: 'Aller', to: 'nulle-part' }],
        },
      ],
    };
    await author.put(`/api/v1/studio/stories/${body.id}/draft`, { revision: 0, document });
    const published = await author.post(`/api/v1/studio/stories/${body.id}/publish`, {});
    expect(published.status).toBe(422);
    expect(published.body.code).toBe('UNPROCESSABLE_CONTENT');
    const codes = published.body.data.diagnostics.map((d: { code: string }) => d.code);
    expect(codes).toEqual(expect.arrayContaining(['broken_link', 'no_ending']));
  });

  it('publie une version immuable avec des statistiques calculées', async () => {
    const story = await publishSample(author, 'le-phare-des-brumes');
    const detail = await author.get(`/api/v1/stories/${story.slug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.version.number).toBe(1);
    expect(detail.body.details.passages).toBe(17);
    expect(detail.body.stats.endings).toBe(5);
    expect(detail.body.stats.minutes).toBeGreaterThanOrEqual(2);
    expect(['gentle', 'balanced', 'challenging', 'brutal']).toContain(detail.body.stats.difficulty);

    // Republier sans changement ne crée pas de nouvelle version.
    const again = await author.post(`/api/v1/studio/stories/${story.id}/publish`, {});
    expect(again.body.version.number).toBe(1);
  });

  it('interdit l’accès au brouillon d’un autre auteur', async () => {
    const { body } = await author.post('/api/v1/studio/stories', { title: 'Secret' });
    const intruder = harness.client();
    await intruder.signUp('Intrus', 'intrus@test.dev');
    expect((await intruder.get(`/api/v1/studio/stories/${body.id}`)).status).toBe(403);
    expect((await harness.client().get(`/api/v1/studio/stories/${body.id}`)).status).toBe(401);
  });

  it('importe un récit Twine', async () => {
    const source =
      ':: StoryTitle\nForêt\n\n:: Départ\nUn sentier. [[Avancer->Fin]]\n\n:: Fin\nC’est fini.';
    const imported = await author.post('/api/v1/studio/import/twee', { source });
    expect(imported.status).toBe(200);
    const draft = await author.get(`/api/v1/studio/stories/${imported.body.id}`);
    expect(draft.body.document.passages.map((p: { id: string }) => p.id)).toEqual([
      'depart',
      'fin',
    ]);
  });

  it('réserve l’export livre-jeu à l’offre Architecte', async () => {
    const { body } = await author.post('/api/v1/studio/stories', { title: 'Papier' });
    expect((await author.get(`/api/v1/studio/stories/${body.id}/gamebook`)).status).toBe(402);
    await author.post('/api/v1/billing/checkout', {
      kind: 'subscription',
      plan: 'architect',
      interval: 'month',
    });
    const exported = await author.get(`/api/v1/studio/stories/${body.id}/gamebook`);
    expect(exported.status).toBe(200);
    expect(exported.body.markdown).toContain("Feuille d'aventure");
  });

  it('archive au lieu de supprimer une œuvre publiée (durabilité)', async () => {
    const story = await publishSample(author, 'signal');
    await author.delete(`/api/v1/studio/stories/${story.id}`);
    const list = await author.get('/api/v1/studio/stories');
    expect(list.body[0].status).toBe('archived');
    const catalog = await harness.client().get('/api/v1/stories');
    expect(catalog.body.items).toHaveLength(0);
    const reader = harness.client();
    expect((await reader.get(`/api/v1/reading/${story.slug}`)).status).toBe(200);
  });
});
