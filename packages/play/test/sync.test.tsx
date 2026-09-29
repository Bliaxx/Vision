// @vitest-environment jsdom
import { StorySchema } from '@dedale/engine';
import { sampleStories } from '@dedale/samples';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chooseInitialSave,
  type LocalSave,
  toReadingEvents,
  useGame,
  useReadingTracker,
  useSaveSync,
} from '../src';

const story = StorySchema.parse(
  sampleStories.find((s) => s.slug === 'le-phare-des-brumes')?.document,
);
const save = (seed: number) => ({ v: 1 as const, seed, actions: [] });

describe('chooseInitialSave', () => {
  const local: LocalSave = {
    versionId: 'v2',
    data: save(1),
    passageTitle: 'A',
    updatedAt: '2026-09-02T10:00:00Z',
  };

  it('préfère la sauvegarde la plus récente', () => {
    const remote = [
      { slot: 'auto', versionId: 'v2', data: save(2), updatedAt: '2026-09-01T10:00:00Z' },
    ];
    expect(chooseInitialSave('v2', remote, local)?.seed).toBe(1);
    const newer = [{ ...remote[0]!, updatedAt: '2026-09-03T10:00:00Z' }];
    expect(chooseInitialSave('v2', newer, local)?.seed).toBe(2);
  });

  it("ignore les sauvegardes d'une autre édition", () => {
    expect(chooseInitialSave('v3', [], local)).toBeNull();
  });
});

describe('toReadingEvents', () => {
  it('ne garde que les faits utiles aux statistiques', () => {
    const { events, ended } = toReadingEvents(
      [
        { type: 'choice:made', passage: 'a', choice: 'c1' },
        { type: 'passage:entered', passage: 'b' },
        { type: 'var:changed', var: 'x', from: 1, to: 2 },
        { type: 'ending:reached', passage: 'b', kind: 'victory', title: 'Fin' },
      ],
      true,
    );
    expect(events.map((event) => event.type)).toEqual(['start', 'choice', 'passage', 'ending']);
    expect(ended).toBe(true);
  });
});

describe('synchronisation', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('écrit localement tout de suite et envoie au serveur après un délai', async () => {
    const persistLocal = vi.fn();
    const pushRemote = vi.fn().mockResolvedValue(undefined);
    const game = renderHook(() => useGame(story, { locale: 'fr', seed: 3 }));
    const sync = renderHook(() =>
      useSaveSync({ enabled: true, persistLocal, pushRemote, versionId: 'v1' }),
    );
    act(() => sync.result.current(game.result.current.session, 'Départ'));
    act(() => sync.result.current(game.result.current.session, 'Départ'));
    expect(persistLocal).toHaveBeenCalledTimes(2);
    expect(pushRemote).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(pushRemote).toHaveBeenCalledTimes(1);
  });

  it('regroupe les événements et vide la file à la sortie', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const tracker = renderHook(() => useReadingTracker({ enabled: true, send }));
    act(() => tracker.result.current([{ type: 'passage:entered', passage: 'a' }], true));
    expect(send).not.toHaveBeenCalled();
    tracker.unmount();
    expect(send).toHaveBeenCalledWith([{ type: 'start' }, { type: 'passage', passage: 'a' }]);
  });
});
