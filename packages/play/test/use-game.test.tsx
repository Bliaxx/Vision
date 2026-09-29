// @vitest-environment jsdom
import { StorySchema, toSaveData } from '@dedale/engine';
import { sampleStories } from '@dedale/samples';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type GameUpdate, useGame } from '../src';

const sample = sampleStories.find((story) => story.slug === 'le-phare-des-brumes');
const story = StorySchema.parse(sample?.document);

describe('useGame', () => {
  it('démarre au passage de départ et avance à chaque choix', () => {
    const updates: GameUpdate[] = [];
    const { result } = renderHook(() =>
      useGame(story, { locale: 'fr', seed: 42, onUpdate: (update) => updates.push(update) }),
    );
    expect(result.current.view.passage.id).toBe(story.start);
    const choice = result.current.view.choices.find((candidate) => candidate.available);
    act(() => result.current.perform({ type: 'choose', choice: choice?.id ?? '' }));
    expect(result.current.session.state.step).toBe(1);
    expect(updates.at(-1)?.reason).toBe('action');
  });

  it('reprend une sauvegarde puis revient en arrière', () => {
    const first = renderHook(() => useGame(story, { locale: 'fr', seed: 7 }));
    for (let turn = 0; turn < 2; turn++) {
      const choice = first.result.current.view.choices.find((candidate) => candidate.available);
      if (choice) act(() => first.result.current.perform({ type: 'choose', choice: choice.id }));
    }
    const save = toSaveData(first.result.current.session);
    const second = renderHook(() => useGame(story, { locale: 'fr', initialSave: save }));
    expect(second.result.current.session.state.passage).toBe(
      first.result.current.session.state.passage,
    );
    expect(second.result.current.restoredFailed).toBe(false);
    act(() => second.result.current.rewindTo(0));
    expect(second.result.current.view.passage.id).toBe(story.start);
  });

  it('ignore une action invalide sans casser la partie', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGame(story, { locale: 'fr', onUpdate }));
    act(() => result.current.perform({ type: 'choose', choice: 'choix-inexistant' }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(result.current.session.state.step).toBe(0);
  });

  it('signale une sauvegarde incompatible et repart de zéro', () => {
    const { result } = renderHook(() =>
      useGame(story, {
        locale: 'fr',
        initialSave: { v: 1, seed: 1, actions: [{ type: 'choose', choice: 'nope' }] },
      }),
    );
    expect(result.current.restoredFailed).toBe(true);
    expect(result.current.view.passage.id).toBe(story.start);
  });
});
