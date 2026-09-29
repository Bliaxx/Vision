import type { ReadingEvent } from '@dedale/contracts';
import { type EngineEvent, type SaveData, type Session, toSaveData } from '@dedale/engine';
import { useEffect, useEffectEvent, useRef } from 'react';

/** Partie mémorisée sur l'appareil (lecture hors ligne, reprise instantanée). */
export interface LocalSave {
  readonly versionId: string;
  readonly data: SaveData;
  readonly passageTitle: string;
  readonly updatedAt: string;
  readonly ended?: boolean;
}

interface RemoteSave {
  readonly slot: string;
  readonly versionId: string;
  readonly data: SaveData;
  readonly updatedAt: string;
}

/** Choisit la sauvegarde la plus récente entre le serveur et l'appareil, pour cette édition. */
export function chooseInitialSave(
  versionId: string,
  remote: readonly RemoteSave[],
  local: LocalSave | null,
): SaveData | null {
  const server = remote.find((save) => save.slot === 'auto' && save.versionId === versionId);
  const device = local && local.versionId === versionId ? local : null;
  if (server && device) {
    return new Date(device.updatedAt) > new Date(server.updatedAt) ? device.data : server.data;
  }
  return server?.data ?? device?.data ?? null;
}

/** Événements du moteur → statistiques anonymes (aucune donnée personnelle). */
export function toReadingEvents(
  events: readonly EngineEvent[],
  started: boolean,
): { events: ReadingEvent[]; ended: boolean } {
  const out: ReadingEvent[] = started ? [{ type: 'start' }] : [];
  let ended = false;
  for (const event of events) {
    if (event.type === 'passage:entered') out.push({ type: 'passage', passage: event.passage });
    if (event.type === 'choice:made')
      out.push({ type: 'choice', passage: event.passage, choice: event.choice });
    if (event.type === 'ending:reached') {
      out.push({ type: 'ending', passage: event.passage });
      ended = true;
    }
  }
  return { events: out, ended };
}

export interface SaveSyncOptions {
  readonly enabled: boolean;
  /** Écriture locale, synchrone et immédiate (la source de vérité hors ligne). */
  readonly persistLocal: (save: LocalSave) => void;
  /** Envoi au serveur, différé et regroupé ; absent si le lecteur n'est pas connecté. */
  readonly pushRemote?: ((data: SaveData) => Promise<unknown>) | undefined;
  readonly versionId: string;
  readonly delayMs?: number;
}

/**
 * Persistance d'une partie : immédiate sur l'appareil, différée vers le serveur.
 * Un échec réseau est silencieux : la sauvegarde locale repartira au prochain choix.
 */
export function useSaveSync(options: SaveSyncOptions) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<SaveData | null>(null);

  const flush = useEffectEvent(async () => {
    const data = pending.current;
    pending.current = null;
    if (!data || !options.pushRemote) return;
    await options.pushRemote(data).catch(() => undefined);
  });

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (session: Session, passageTitle: string) => {
    if (!options.enabled) return;
    const data = toSaveData(session);
    const ended = session.state.status === 'ended';
    try {
      options.persistLocal({
        versionId: options.versionId,
        data,
        passageTitle,
        updatedAt: new Date().toISOString(),
        ended,
      });
    } catch {
      // Stockage plein ou indisponible : la partie continue.
    }
    pending.current = data;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), ended ? 0 : (options.delayMs ?? 900));
  };
}

export interface ReadingTrackerOptions {
  readonly enabled: boolean;
  readonly send: (events: ReadingEvent[]) => Promise<unknown>;
  readonly delayMs?: number;
}

/** File d'événements de lecture, envoyée par lots de 50 (et vidée à la sortie). */
export function useReadingTracker(options: ReadingTrackerOptions) {
  const queue = useRef<ReadingEvent[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useEffectEvent(() => {
    const events = queue.current.splice(0, 50);
    if (events.length > 0) void options.send(events).catch(() => undefined);
  });

  const onUnmount = useEffectEvent(() => {
    if (timer.current) clearTimeout(timer.current);
    flush();
  });
  useEffect(() => () => onUnmount(), []);

  return (events: readonly EngineEvent[], started: boolean) => {
    if (!options.enabled) return;
    const batch = toReadingEvents(events, started);
    queue.current.push(...batch.events);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), batch.ended ? 0 : (options.delayMs ?? 2_000));
  };
}
