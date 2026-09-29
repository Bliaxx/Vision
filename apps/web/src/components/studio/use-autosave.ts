'use client';

import { isDefinedError, safe } from '@dedale/api-client';
import { useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api/browser';
import type { EditorStore } from './store';

const DEBOUNCE_MS = 1200;
const RETRY_MS = 5000;

/**
 * Sauvegarde automatique du brouillon, avec concurrence optimiste :
 * le serveur refuse une révision périmée (`CONFLICT`) plutôt que d'écraser
 * le travail fait dans un autre onglet.
 *
 * Retourne `flush`, qui force l'enregistrement immédiat (publication, sortie).
 */
export function useAutosave(store: EditorStore): () => Promise<boolean> {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<boolean> | null>(null);

  const save = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) await inFlight.current;
    const state = store.getState();
    if (state.saveState === 'saved') return true;
    if (state.saveState === 'conflict') return false;

    const run = (async () => {
      const { storyId, revision, doc } = store.getState();
      store.getState().markSaving();
      const [error, result] = await safe(
        api.authoring.saveDraft({ id: storyId, revision, document: doc }),
      );
      if (error) {
        store
          .getState()
          .markFailed(isDefinedError(error) && error.code === 'CONFLICT' ? 'conflict' : 'error');
        return false;
      }
      store.getState().markSaved(result.revision);
      return store.getState().saveState === 'saved';
    })();

    inFlight.current = run;
    try {
      return await run;
    } finally {
      inFlight.current = null;
    }
  }, [store]);

  const schedule = useCallback(
    (delay: number) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        void save().then((ok) => {
          const { saveState } = store.getState();
          if (!ok && saveState === 'error') schedule(RETRY_MS);
          else if (saveState === 'dirty') schedule(DEBOUNCE_MS);
        });
      }, delay);
    },
    [save, store],
  );

  useEffect(() => {
    if (store.getState().saveState === 'dirty') schedule(DEBOUNCE_MS);
    const unsubscribe = store.subscribe((state, previous) => {
      if (state.doc !== previous.doc && state.saveState === 'dirty') schedule(DEBOUNCE_MS);
    });
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (store.getState().saveState !== 'saved') event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', beforeUnload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [schedule, store]);

  return useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    return save();
  }, [save]);
}
