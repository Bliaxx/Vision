'use client';

import type { ReadingEvent, SaveRecord } from '@dedale/contracts';
import type { EngineEvent, SaveData, Session } from '@dedale/engine';
import { toSaveData } from '@dedale/engine';
import { useEffect, useEffectEvent, useRef } from 'react';
import { api } from '@/lib/api/browser';

interface LocalSave {
  versionId: string;
  data: SaveData;
  passageTitle: string;
  updatedAt: string;
}

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
  const server = serverSaves.find((save) => save.slot === 'auto' && save.versionId === versionId);
  const local = typeof window === 'undefined' ? null : readLocalSave(storyId);
  const localUsable = local && local.versionId === versionId ? local : null;
  if (server && localUsable) {
    return new Date(localUsable.updatedAt) > new Date(server.updatedAt)
      ? localUsable.data
      : server.data;
  }
  return server?.data ?? localUsable?.data ?? null;
}

/**
 * Persistance d'une partie : immédiate sur l'appareil (lecture hors ligne),
 * différée vers le serveur quand le lecteur est connecté (synchronisation).
 */
export function useSaveSync(options: {
  storyId: string;
  versionId: string;
  signedIn: boolean;
  enabled: boolean;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<SaveData | null>(null);

  const flush = async () => {
    const data = pending.current;
    pending.current = null;
    if (!data || !options.signedIn) return;
    try {
      await api.reading.saveProgress({
        storyId: options.storyId,
        versionId: options.versionId,
        slot: 'auto',
        data,
      });
    } catch {
      // Hors ligne : la sauvegarde locale fait foi, elle repartira au prochain choix.
    }
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (session: Session, passageTitle: string) => {
    if (!options.enabled) return;
    const data = toSaveData(session);
    try {
      const local: LocalSave = {
        versionId: options.versionId,
        data,
        passageTitle,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(localKey(options.storyId), JSON.stringify(local));
    } catch {
      // Stockage plein ou indisponible.
    }
    pending.current = data;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, session.state.status === 'ended' ? 0 : 900);
  };
}

/** Transforme les événements du moteur en statistiques anonymes (par lots). */
export function useReadingTracker(options: {
  storyId: string;
  versionId: string;
  enabled: boolean;
}) {
  const queue = useRef<ReadingEvent[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = () => {
    const events = queue.current.splice(0, 50);
    if (events.length === 0) return;
    void api.reading
      .track({ storyId: options.storyId, versionId: options.versionId, events })
      .catch(() => {});
  };

  // Vidage de la file à la sortie de la liseuse.
  const onUnmount = useEffectEvent(() => {
    if (timer.current) clearTimeout(timer.current);
    flush();
  });
  useEffect(() => () => onUnmount(), []);

  return (events: readonly EngineEvent[], started: boolean) => {
    if (!options.enabled) return;
    if (started) queue.current.push({ type: 'start' });
    let ended = false;
    for (const event of events) {
      if (event.type === 'passage:entered')
        queue.current.push({ type: 'passage', passage: event.passage });
      if (event.type === 'choice:made')
        queue.current.push({ type: 'choice', passage: event.passage, choice: event.choice });
      if (event.type === 'ending:reached') {
        queue.current.push({ type: 'ending', passage: event.passage });
        ended = true;
      }
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, ended ? 0 : 2_000);
  };
}
