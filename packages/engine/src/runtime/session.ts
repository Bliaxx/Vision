import { z } from 'zod';
import type { CompiledStory } from './compile';
import { type Action, applyAction, createGame, EngineError } from './engine';
import type { EngineEvent } from './events';
import type { GameState } from './state';

/** Jalon du fil d'Ariane : passage atteint après `step` actions. */
export interface Milestone {
  readonly step: number;
  readonly passage: string;
  readonly checkpoint: boolean;
}

/**
 * Une session = graine + journal d'actions + état courant. Le journal est la
 * vérité : l'état peut toujours être reconstruit par rejeu, ce qui rend le
 * retour arrière exact et les sauvegardes vérifiables.
 */
export interface Session {
  readonly seed: number;
  readonly actions: readonly Action[];
  readonly state: GameState;
  readonly milestones: readonly Milestone[];
}

export interface SessionUpdate {
  readonly session: Session;
  readonly events: readonly EngineEvent[];
}

function milestoneFor(story: CompiledStory, state: GameState): Milestone {
  return {
    step: state.step,
    passage: state.passage,
    checkpoint: story.passages.get(state.passage)?.checkpoint ?? false,
  };
}

export function startSession(story: CompiledStory, seed: number): SessionUpdate {
  const { state, events } = createGame(story, seed);
  return {
    session: { seed: state.seed, actions: [], state, milestones: [milestoneFor(story, state)] },
    events,
  };
}

export function act(story: CompiledStory, session: Session, action: Action): SessionUpdate {
  const { state, events } = applyAction(story, session.state, action);
  return {
    session: {
      seed: session.seed,
      actions: [...session.actions, action],
      state,
      milestones: [...session.milestones, milestoneFor(story, state)],
    },
    events,
  };
}

/** Rejoue une partie complète. Lève `EngineError` si le journal est incompatible. */
export function replay(story: CompiledStory, seed: number, actions: readonly Action[]): Session {
  let { session } = startSession(story, seed);
  for (const action of actions) session = act(story, session, action).session;
  return session;
}

/** Jalons vers lesquels le lecteur peut revenir selon la politique du récit. */
export function rewindTargets(story: CompiledStory, session: Session): Milestone[] {
  const policy = story.story.settings.rewind;
  if (policy === 'none') return [];
  const past = session.milestones.filter((milestone) => milestone.step < session.state.step);
  if (policy === 'free') return past;
  return past.filter((milestone) => milestone.checkpoint || milestone.step === 0);
}

export function rewind(story: CompiledStory, session: Session, step: number): Session {
  const allowed = rewindTargets(story, session).some((milestone) => milestone.step === step);
  if (!allowed) throw new EngineError('choice_unavailable', `retour impossible à l'étape ${step}`);
  return replay(story, session.seed, session.actions.slice(0, step));
}

// --- Sauvegardes --------------------------------------------------------

export const ActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('choose'), choice: z.string().min(1).max(64) }),
  z.object({ type: z.literal('attack') }),
  z.object({ type: z.literal('flee') }),
]);

export const SaveDataSchema = z.object({
  v: z.literal(1),
  seed: z.number().int().min(0).max(4_294_967_295),
  actions: z.array(ActionSchema).max(10_000),
});

/** Sauvegarde portable : quelques centaines d'octets pour une partie entière. */
export type SaveData = z.infer<typeof SaveDataSchema>;

export function toSaveData(session: Session): SaveData {
  return { v: 1, seed: session.seed, actions: [...session.actions] };
}

export type RestoreResult =
  | { ok: true; session: Session }
  | { ok: false; reason: 'invalid_save' | 'incompatible_story'; detail: string };

/** Restaure une sauvegarde non fiable en la rejouant contre le récit. */
export function restoreSession(story: CompiledStory, data: unknown): RestoreResult {
  const parsed = SaveDataSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, reason: 'invalid_save', detail: parsed.error.issues[0]?.message ?? '' };
  }
  try {
    return { ok: true, session: replay(story, parsed.data.seed, parsed.data.actions) };
  } catch (error) {
    if (error instanceof EngineError) {
      return { ok: false, reason: 'incompatible_story', detail: error.message };
    }
    throw error;
  }
}
