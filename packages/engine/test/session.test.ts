import { describe, expect, it } from 'vitest';
import {
  act,
  compileStory,
  replay,
  restoreSession,
  rewind,
  rewindTargets,
  type Session,
  StorySchema,
  startSession,
  toSaveData,
} from '../src';
import { lighthouseInput } from './fixtures/lighthouse';

const withPolicy = (rewind: 'free' | 'checkpoint' | 'none') =>
  compileStory(
    StorySchema.parse({ ...lighthouseInput, settings: { ...lighthouseInput.settings, rewind } }),
  );

function playThrough(policy: 'free' | 'checkpoint' | 'none'): Session {
  const story = withPolicy(policy);
  let { session } = startSession(story, 99);
  for (const choice of ['fouiller', 'entrer', 'sortir', 'entrer']) {
    session = act(story, session, { type: 'choose', choice }).session;
  }
  return session;
}

describe('sessions', () => {
  it('journalise les actions et les jalons du fil d’Ariane', () => {
    const session = playThrough('free');
    expect(session.actions).toHaveLength(4);
    expect(session.milestones.map((m) => m.passage)).toEqual([
      'debut',
      'debut',
      'hall',
      'debut',
      'hall',
    ]);
    expect(session.state.path).toEqual(['debut', 'debut', 'hall', 'debut', 'hall']);
  });

  it('rejoue exactement une partie', () => {
    const story = withPolicy('free');
    const session = playThrough('free');
    expect(replay(story, session.seed, session.actions)).toEqual(session);
  });

  it('retour arrière libre', () => {
    const story = withPolicy('free');
    const session = playThrough('free');
    expect(rewindTargets(story, session).map((m) => m.step)).toEqual([0, 1, 2, 3]);
    const back = rewind(story, session, 2);
    expect(back.state.passage).toBe('hall');
    expect(back.actions).toHaveLength(2);
    expect(back.state.inventory.lanterne).toBe(1);
  });

  it('retour arrière limité aux points de sauvegarde', () => {
    const story = withPolicy('checkpoint');
    const session = playThrough('checkpoint');
    expect(rewindTargets(story, session).map((m) => m.passage)).toEqual([
      'debut',
      'debut',
      'debut',
    ]);
    expect(() => rewind(story, session, 2)).toThrow();
  });

  it('mode puriste : aucun retour', () => {
    const story = withPolicy('none');
    expect(rewindTargets(story, playThrough('none'))).toEqual([]);
  });
});

describe('sauvegardes', () => {
  it('sont compactes et restaurables', () => {
    const story = withPolicy('free');
    const session = playThrough('free');
    const save = toSaveData(session);
    expect(JSON.stringify(save).length).toBeLessThan(200);
    const restored = restoreSession(story, JSON.parse(JSON.stringify(save)));
    expect(restored.ok && restored.session).toEqual(session);
  });

  it('rejettent une donnée corrompue', () => {
    const story = withPolicy('free');
    expect(restoreSession(story, { v: 2 })).toMatchObject({ ok: false, reason: 'invalid_save' });
    expect(restoreSession(story, { v: 1, seed: -1, actions: [] })).toMatchObject({ ok: false });
  });

  it('détectent une incompatibilité avec une nouvelle version du récit', () => {
    const story = withPolicy('free');
    const save = toSaveData(playThrough('free'));
    const edited = compileStory(
      StorySchema.parse({
        ...lighthouseInput,
        passages: lighthouseInput.passages.map((passage) =>
          passage.id === 'hall'
            ? { ...passage, choices: [{ id: 'nouveau', text: 'Nouveau', to: 'debut' }] }
            : passage,
        ),
      }),
    );
    expect(restoreSession(story, save).ok).toBe(true);
    expect(restoreSession(edited, save)).toMatchObject({ ok: false, reason: 'incompatible_story' });
  });
});
