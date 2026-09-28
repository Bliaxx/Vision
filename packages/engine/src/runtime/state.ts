import type { ExprScope } from '../expr/evaluate';
import type { EndingKind, Value } from '../format/types';
import type { RngState } from './rng';

export interface EnemyState {
  readonly id: string;
  readonly name: string;
  readonly skill: number;
  readonly stamina: number;
  readonly maxStamina: number;
}

export interface EncounterState {
  /** Index de l'adversaire affronté (les ennemis se succèdent). */
  readonly current: number;
  readonly enemies: readonly EnemyState[];
  readonly round: number;
}

export interface EndingState {
  readonly passage: string;
  readonly kind: EndingKind;
  readonly title: string;
}

/**
 * État complet et sérialisable d'une partie. Immuable : chaque action produit
 * un nouvel état (voir `engine.ts`).
 */
export interface GameState extends ExprScope {
  readonly v: 1;
  readonly seed: number;
  readonly rng: RngState;
  readonly passage: string;
  readonly vars: Readonly<Record<string, Value>>;
  readonly inventory: Readonly<Record<string, number>>;
  readonly visits: Readonly<Record<string, number>>;
  readonly achievements: readonly string[];
  /** Choix « à usage unique » déjà empruntés (`passage/choix`). */
  readonly taken: readonly string[];
  /** Règles globales « once » déjà déclenchées. */
  readonly firedRules: readonly string[];
  /** Fil d'Ariane : séquence des passages traversés. */
  readonly path: readonly string[];
  readonly encounter: EncounterState | null;
  readonly status: 'playing' | 'ended';
  readonly ending: EndingState | null;
  /** Nombre d'actions appliquées depuis le début de la partie. */
  readonly step: number;
}

/** Copie de travail mutable, utilisée uniquement à l'intérieur d'une transition. */
export interface DraftState {
  v: 1;
  seed: number;
  rng: RngState;
  passage: string;
  vars: Record<string, Value>;
  inventory: Record<string, number>;
  visits: Record<string, number>;
  achievements: string[];
  taken: string[];
  firedRules: string[];
  path: string[];
  encounter: EncounterState | null;
  status: 'playing' | 'ended';
  ending: EndingState | null;
  step: number;
}

export function toDraft(state: GameState): DraftState {
  return {
    ...state,
    vars: { ...state.vars },
    inventory: { ...state.inventory },
    visits: { ...state.visits },
    achievements: [...state.achievements],
    taken: [...state.taken],
    firedRules: [...state.firedRules],
    path: [...state.path],
  };
}

export const choiceKey = (passage: string, choice: string) => `${passage}/${choice}`;
