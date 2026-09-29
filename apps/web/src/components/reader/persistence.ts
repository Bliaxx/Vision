'use client';

import type { SaveRecord } from '@dedale/contracts';
import type { SaveData } from '@dedale/engine';
import {
  chooseInitialSave,
  type LocalSave,
  useSaveSync as useSharedSaveSync,
  useReadingTracker as useSharedTracker,
} from '@dedale/play';
import { api } from '@/lib/api/browser';

/**
 * Adaptateurs web de la synchronisation partagée (`@dedale/play`) :
 * `localStorage` pour l'appareil, l'API pour le compte.
 */
const localKey = (storyId: string) => `dedale:save:${storyId}`;

export function readLocalSave(storyId: string): LocalSave | null {
  try {
    const raw = localStorage.getItem(localKey(storyId));
    return raw ? (JSON.parse(raw) as LocalSave) : null;
  } catch {
    return null;
  }
}

/** Choisit la sauvegarde la plus récente entre le serveur et l'appareil. */
export function pickInitialSave(
  storyId: string,
  versionId: string,
  serverSaves: readonly SaveRecord[],
): SaveData | null {
  const local = typeof window === 'undefined' ? null : readLocalSave(storyId);
  return chooseInitialSave(versionId, serverSaves, local);
}

export function useSaveSync(options: {
  storyId: string;
  versionId: string;
  signedIn: boolean;
  enabled: boolean;
}) {
  const { storyId, versionId } = options;
  return useSharedSaveSync({
    enabled: options.enabled,
    versionId,
    persistLocal: (save) => localStorage.setItem(localKey(storyId), JSON.stringify(save)),
    pushRemote: options.signedIn
      ? (data) => api.reading.saveProgress({ storyId, versionId, slot: 'auto', data })
      : undefined,
  });
}

export function useReadingTracker(options: {
  storyId: string;
  versionId: string;
  enabled: boolean;
}) {
  const { storyId, versionId } = options;
  return useSharedTracker({
    enabled: options.enabled,
    send: (events) => api.reading.track({ storyId, versionId, events }),
  });
}
