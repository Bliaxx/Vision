import type { Draft } from '@dedale/contracts';
import { StorySchema } from '@dedale/engine';
import { sampleStories } from '@dedale/samples';
import { describe, expect, it } from 'vitest';
import { createEditorStore } from '@/components/studio/store';

const sample = sampleStories.find((story) => story.slug === 'le-phare-des-brumes');
if (!sample) throw new Error('échantillon introuvable');
const phare = StorySchema.parse(sample.document);

function draft(): Draft {
  return {
    id: '01920000-0000-7000-8000-000000000001',
    slug: sample.slug,
    status: 'draft',
    meta: {
      title: 'Le Phare des Brumes',
      tagline: null,
      synopsis: '',
      language: 'fr',
      genres: ['adventure'],
      tags: [],
      ageRating: 'all',
      contentWarnings: [],
      access: 'free',
      priceCents: null,
      license: 'all-rights-reserved',
      aiUsage: 'none',
      coverUrl: null,
    },
    document: phare,
    revision: 3,
    updatedAt: new Date(0).toISOString(),
    versions: [],
  };
}

describe("store de l'éditeur", () => {
  it('place automatiquement les passages sans position', () => {
    const store = createEditorStore(draft());
    const { doc } = store.getState();
    expect(doc.passages.every((passage) => passage.position)).toBe(true);
    expect(store.getState().selectedId).toBe(doc.start);
  });

  it('annule et rétablit une modification', () => {
    const store = createEditorStore(draft());
    const before = store.getState().doc;
    store.getState().update((doc) => {
      doc.title = 'Autre titre';
    });
    expect(store.getState().doc.title).toBe('Autre titre');
    expect(store.getState().saveState).toBe('dirty');
    store.getState().undo();
    expect(store.getState().doc).toBe(before);
    store.getState().redo();
    expect(store.getState().doc.title).toBe('Autre titre');
  });

  it('regroupe les frappes successives dans une seule étape', () => {
    const store = createEditorStore(draft());
    const start = store.getState().doc.start;
    for (const title of ['L', 'La', 'La g', 'La grève']) {
      store.getState().update(
        (doc) => {
          const passage = doc.passages.find((candidate) => candidate.id === start);
          if (passage) passage.title = title;
        },
        { coalesce: 'title' },
      );
    }
    expect(store.getState().past).toHaveLength(1);
    store.getState().undo();
    expect(store.getState().past).toHaveLength(0);
  });

  it('ajoute un passage relié et le sélectionne', () => {
    const store = createEditorStore(draft());
    const { start } = store.getState().doc;
    const id = store.getState().addPassage({ x: 10, y: 20 }, { ending: true });
    store.getState().addChoice(start, id, 'Vers la fin');
    const state = store.getState();
    expect(state.selectedId).toBe(id);
    expect(state.doc.passages.find((passage) => passage.id === id)?.ending?.kind).toBe('neutral');
    const choices = state.doc.passages.find((passage) => passage.id === start)?.choices ?? [];
    expect(choices.at(-1)).toMatchObject({ to: id, text: 'Vers la fin' });
  });

  it('refuse de supprimer le passage de départ', () => {
    const store = createEditorStore(draft());
    const { doc } = store.getState();
    store.getState().deletePassage(doc.start);
    expect(store.getState().doc.passages).toHaveLength(doc.passages.length);
  });

  it("marque l'enregistrement sans perdre une frappe arrivée entre-temps", () => {
    const store = createEditorStore(draft());
    store.getState().update((doc) => {
      doc.title = 'A';
    });
    store.getState().markSaving();
    store.getState().update((doc) => {
      doc.title = 'AB';
    });
    store.getState().markSaved(4);
    expect(store.getState().revision).toBe(4);
    expect(store.getState().saveState).toBe('dirty');
  });

  it('met à jour les diagnostics à chaque modification', () => {
    const store = createEditorStore(draft());
    expect(store.getState().analysis.publishable).toBe(true);
    const { start } = store.getState().doc;
    store.getState().addChoice(start, 'passage-inexistant');
    expect(store.getState().analysis.diagnostics.some((d) => d.code === 'broken_link')).toBe(true);
  });
});
