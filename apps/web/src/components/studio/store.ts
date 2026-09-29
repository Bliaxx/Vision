'use client';

import type { Draft, StoryMeta } from '@dedale/contracts';
import {
  type AnalysisReport,
  analyzeStory,
  type Choice,
  createId,
  type Passage,
  type Story,
  StorySchema,
} from '@dedale/engine';
import { type Draft as ImmerDraft, produce } from 'immer';
import { createStore } from 'zustand/vanilla';
import { layoutStory } from '@/lib/story-layout';

export type SaveState = 'saved' | 'dirty' | 'saving' | 'conflict' | 'error';

export interface EditorState {
  readonly storyId: string;
  readonly slug: string;
  readonly doc: Story;
  readonly meta: StoryMeta;
  readonly status: Draft['status'];
  readonly revision: number;
  readonly analysis: AnalysisReport;
  readonly selectedId: string | null;
  readonly saveState: SaveState;
  /** Historique d'annulation (documents entiers : ils sont petits et immuables). */
  readonly past: readonly Story[];
  readonly future: readonly Story[];
  /** Regroupe les frappes successives d'un même champ en une seule étape d'annulation. */
  readonly lastCoalesceKey: string | null;
}

export interface EditorActions {
  update(mutator: (draft: ImmerDraft<Story>) => void, options?: { coalesce?: string }): void;
  undo(): void;
  redo(): void;
  select(id: string | null): void;
  setMeta(meta: StoryMeta): void;
  setStatus(status: Draft['status']): void;
  markSaving(): void;
  markSaved(revision: number): void;
  markFailed(state: 'conflict' | 'error'): void;
  addPassage(
    position?: { x: number; y: number },
    options?: { ending?: boolean; title?: string },
  ): string;
  deletePassage(id: string): void;
  addChoice(passageId: string, to?: string, text?: string): void;
  autoLayout(): void;
}

export type EditorStore = ReturnType<typeof createEditorStore>;

const HISTORY_LIMIT = 100;

function withLayout(doc: Story): Story {
  if (doc.passages.every((passage) => passage.position)) return doc;
  const positions = layoutStory(doc);
  return {
    ...doc,
    passages: doc.passages.map((passage) => ({
      ...passage,
      position: passage.position ?? positions.get(passage.id) ?? { x: 0, y: 0 },
    })),
  };
}

export function createEditorStore(draft: Draft) {
  const initial = withLayout(StorySchema.parse(draft.document));
  return createStore<EditorState & EditorActions>()((set, get) => {
    const commit = (next: Story, coalesce?: string) => {
      const state = get();
      const merge = coalesce !== undefined && coalesce === state.lastCoalesceKey;
      set({
        doc: next,
        analysis: analyzeStory(next),
        past: merge ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT),
        future: [],
        saveState: 'dirty',
        lastCoalesceKey: coalesce ?? null,
      });
    };

    const passageIds = () => new Set(get().doc.passages.map((passage) => passage.id));

    return {
      storyId: draft.id,
      slug: draft.slug,
      doc: initial,
      meta: draft.meta,
      status: draft.status,
      revision: draft.revision,
      analysis: analyzeStory(initial),
      selectedId: initial.start,
      saveState: draft.document.passages.every((passage) => passage.position) ? 'saved' : 'dirty',
      past: [],
      future: [],
      lastCoalesceKey: null,

      update: (mutator, options) => commit(produce(get().doc, mutator), options?.coalesce),

      undo: () => {
        const { past, doc, future } = get();
        const previous = past.at(-1);
        if (!previous) return;
        set({
          doc: previous,
          analysis: analyzeStory(previous),
          past: past.slice(0, -1),
          future: [doc, ...future],
          saveState: 'dirty',
          lastCoalesceKey: null,
        });
      },

      redo: () => {
        const { past, doc, future } = get();
        const next = future[0];
        if (!next) return;
        set({
          doc: next,
          analysis: analyzeStory(next),
          past: [...past, doc],
          future: future.slice(1),
          saveState: 'dirty',
          lastCoalesceKey: null,
        });
      },

      select: (id) => set({ selectedId: id, lastCoalesceKey: null }),
      setMeta: (meta) => set({ meta }),
      setStatus: (status) => set({ status }),
      markSaving: () => set({ saveState: 'saving' }),
      markSaved: (revision) =>
        set((state) => ({
          revision,
          saveState: state.saveState === 'saving' ? 'saved' : state.saveState,
        })),
      markFailed: (saveState) => set({ saveState }),

      addPassage: (position, options) => {
        const id = createId('p', passageIds());
        const fr = get().doc.language.startsWith('fr');
        const passage: Passage = {
          id,
          title:
            options?.title ??
            (options?.ending
              ? fr
                ? 'Nouvelle fin'
                : 'New ending'
              : fr
                ? 'Nouveau passage'
                : 'New passage'),
          text: '',
          tags: [],
          checkpoint: false,
          onEnter: [],
          choices: [],
          position: position ?? { x: 0, y: 0 },
          ...(options?.ending
            ? { ending: { kind: 'neutral' as const, title: fr ? 'Fin' : 'The end' } }
            : {}),
        };
        commit(produce(get().doc, (doc) => void doc.passages.push(passage)));
        set({ selectedId: id });
        return id;
      },

      deletePassage: (id) => {
        const { doc } = get();
        if (doc.start === id) return;
        commit(
          produce(doc, (draftDoc) => {
            draftDoc.passages = draftDoc.passages.filter((passage) => passage.id !== id);
          }),
        );
        set({ selectedId: doc.start });
      },

      addChoice: (passageId, to, text) => {
        const fr = get().doc.language.startsWith('fr');
        commit(
          produce(get().doc, (doc) => {
            const passage = doc.passages.find((candidate) => candidate.id === passageId);
            if (!passage) return;
            const ids = new Set(passage.choices.map((choice) => choice.id));
            const choice: Choice = {
              id: createId('c', ids),
              text: text ?? (fr ? 'Nouveau choix' : 'New choice'),
              to: to ?? passage.id,
              effects: [],
              once: false,
            };
            passage.choices.push(choice);
          }),
        );
      },

      autoLayout: () => {
        const positions = layoutStory(get().doc);
        commit(
          produce(get().doc, (doc) => {
            for (const passage of doc.passages)
              passage.position = positions.get(passage.id) ?? passage.position;
          }),
        );
      },
    };
  });
}
