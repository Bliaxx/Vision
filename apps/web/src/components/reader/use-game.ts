'use client';

import {
  type Action,
  act,
  type CompiledStory,
  compileStory,
  EngineError,
  type EngineEvent,
  getView,
  type Milestone,
  randomSeed,
  restoreSession,
  rewind,
  rewindTargets,
  type SaveData,
  type Session,
  type Story,
  startSession,
} from '@dedale/engine';
import { useLocale } from 'next-intl';
import { useMemo, useState } from 'react';

export interface GameUpdate {
  readonly session: Session;
  readonly events: readonly EngineEvent[];
  readonly reason: 'start' | 'action' | 'rewind' | 'restore';
}

function freshSession(story: CompiledStory, seed = randomSeed()) {
  return startSession(story, seed);
}

/**
 * État d'une partie côté client : le moteur est exécuté localement (lecture
 * instantanée, hors ligne possible), la persistance est déléguée à `onUpdate`.
 */
export function useGame(
  story: Story,
  options: {
    initialSave?: SaveData | null;
    onUpdate?: (update: GameUpdate) => void;
  } = {},
) {
  const locale = useLocale();
  const compiled = useMemo(() => compileStory(story), [story]);

  const [state, setState] = useState(() => {
    if (options.initialSave) {
      const restored = restoreSession(compiled, options.initialSave);
      if (restored.ok)
        return {
          session: restored.session,
          events: [] as readonly EngineEvent[],
          restoredFailed: false,
        };
      return { ...freshSession(compiled), restoredFailed: true };
    }
    return { ...freshSession(compiled), restoredFailed: false };
  });

  const view = useMemo(
    () => getView(compiled, state.session.state, locale),
    [compiled, state.session.state, locale],
  );

  const commit = (update: GameUpdate) => {
    setState({ session: update.session, events: update.events, restoredFailed: false });
    options.onUpdate?.(update);
  };

  const perform = (action: Action) => {
    try {
      const update = act(compiled, state.session, action);
      commit({ ...update, reason: 'action' });
    } catch (error) {
      if (!(error instanceof EngineError)) throw error;
      console.warn('action refusée', error.code);
    }
  };

  const restart = () => commit({ ...freshSession(compiled), reason: 'start' });

  const rewindTo = (step: number) => {
    commit({ session: rewind(compiled, state.session, step), events: [], reason: 'rewind' });
  };

  const targets: Milestone[] = rewindTargets(compiled, state.session);

  return {
    compiled,
    session: state.session,
    events: state.events,
    restoredFailed: state.restoredFailed,
    view,
    perform,
    restart,
    rewindTo,
    targets,
  };
}
