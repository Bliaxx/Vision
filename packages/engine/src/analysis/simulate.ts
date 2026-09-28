import type { EndingKind } from '../format/types';
import type { CompiledStory } from '../runtime/compile';
import {
  type Action,
  applyAction,
  createGame,
  EngineError,
  encounterActions,
} from '../runtime/engine';
import { nextFloat, type RngState, seedRng } from '../runtime/rng';
import type { GameState } from '../runtime/state';
import { getView } from '../runtime/view';
import { countMarkupWords } from './stats';

export type Difficulty = 'gentle' | 'balanced' | 'challenging' | 'brutal';

export interface SimulationOptions {
  readonly runs?: number;
  readonly seed?: number;
  /** Au-delà, la partie est considérée comme une boucle sans fin. */
  readonly maxSteps?: number;
  /** Vitesse de lecture moyenne (mots par minute). */
  readonly wordsPerMinute?: number;
}

export interface SimulationReport {
  readonly runs: number;
  readonly completed: number;
  readonly stuck: number;
  readonly exhausted: number;
  readonly errors: number;
  readonly endings: Readonly<Record<string, number>>;
  readonly endingKinds: Readonly<Record<EndingKind, number>>;
  readonly passageVisits: Readonly<Record<string, number>>;
  /** Part des passages vus au moins une fois sur l'ensemble des parties. */
  readonly coverage: number;
  readonly averageSteps: number;
  readonly averageWords: number;
  readonly estimatedMinutes: number;
  /** Part des parties terminées par une mort ou une défaite. */
  readonly failureRate: number;
  readonly difficulty: Difficulty;
}

export function difficultyFromFailureRate(rate: number): Difficulty {
  if (rate < 0.15) return 'gentle';
  if (rate < 0.4) return 'balanced';
  if (rate < 0.7) return 'challenging';
  return 'brutal';
}

/**
 * Simulation de Monte-Carlo : des lecteurs virtuels choisissent au hasard.
 * Donne à l'auteur une mesure objective de la difficulté, de la durée de
 * lecture et de la couverture de son récit — et alimente la fiche du livre.
 */
export function simulate(story: CompiledStory, options: SimulationOptions = {}): SimulationReport {
  const runs = options.runs ?? 300;
  const maxSteps = options.maxSteps ?? 400;
  const wordsPerMinute = options.wordsPerMinute ?? 220;
  let strategy: RngState = seedRng(options.seed ?? 1);
  const pick = (count: number): number => {
    const [value, next] = nextFloat(strategy);
    strategy = next;
    return Math.floor(value * count);
  };

  const wordsByPassage = new Map(
    story.story.passages.map((passage) => [passage.id, countMarkupWords(passage.text)]),
  );
  const endings: Record<string, number> = {};
  const endingKinds: Record<EndingKind, number> = {
    victory: 0,
    defeat: 0,
    death: 0,
    neutral: 0,
    secret: 0,
  };
  const passageVisits: Record<string, number> = {};
  let completed = 0;
  let stuck = 0;
  let exhausted = 0;
  let errors = 0;
  let totalSteps = 0;
  let totalWords = 0;

  for (let run = 0; run < runs; run++) {
    let state: GameState;
    try {
      state = createGame(story, (options.seed ?? 1) * 7919 + run).state;
    } catch (error) {
      if (!(error instanceof EngineError)) throw error;
      errors++;
      continue;
    }
    let outcome: 'completed' | 'stuck' | 'exhausted' | 'error' = 'exhausted';
    try {
      while (state.step < maxSteps) {
        if (state.status === 'ended') {
          outcome = 'completed';
          break;
        }
        let action: Action | null = null;
        const combat = encounterActions(story, state);
        if (combat.attack) {
          action = combat.flee && pick(100) < 15 ? { type: 'flee' } : { type: 'attack' };
        } else {
          const available = getView(story, state).choices.filter((choice) => choice.available);
          const choice = available[pick(available.length)];
          if (choice) action = { type: 'choose', choice: choice.id };
        }
        if (!action) {
          outcome = 'stuck';
          break;
        }
        state = applyAction(story, state, action).state;
      }
    } catch (error) {
      if (!(error instanceof EngineError)) throw error;
      outcome = 'error';
    }

    for (const id of new Set(state.path)) passageVisits[id] = (passageVisits[id] ?? 0) + 1;
    totalSteps += state.step;
    totalWords += state.path.reduce((sum, id) => sum + (wordsByPassage.get(id) ?? 0), 0);
    if (outcome === 'completed' && state.ending) {
      completed++;
      endings[state.ending.passage] = (endings[state.ending.passage] ?? 0) + 1;
      endingKinds[state.ending.kind]++;
    } else if (outcome === 'stuck') stuck++;
    else if (outcome === 'exhausted') exhausted++;
    else errors++;
  }

  const played = Math.max(1, runs - errors);
  const averageSteps = totalSteps / played;
  const averageWords = totalWords / played;
  const failureRate = (endingKinds.death + endingKinds.defeat) / played;
  return {
    runs,
    completed,
    stuck,
    exhausted,
    errors,
    endings,
    endingKinds,
    passageVisits,
    coverage: Object.keys(passageVisits).length / Math.max(1, story.story.passages.length),
    averageSteps: Math.round(averageSteps * 10) / 10,
    averageWords: Math.round(averageWords),
    estimatedMinutes: Math.max(
      1,
      Math.round(averageWords / wordsPerMinute + (averageSteps * 5) / 60),
    ),
    failureRate: Math.round(failureRate * 1000) / 1000,
    difficulty: difficultyFromFailureRate(failureRate),
  };
}
