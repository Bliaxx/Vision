import { type RngState, rollDie } from './rng';

export interface DiceSpec {
  readonly count: number;
  readonly sides: number;
}

export interface DiceRoll {
  readonly rolls: readonly number[];
  readonly total: number;
}

const DICE = /^\s*(\d{1,2})\s*d\s*(\d{1,3})\s*$/i;

/** `2d6` → `{ count: 2, sides: 6 }`. Retourne `null` si la notation est invalide. */
export function parseDice(notation: string): DiceSpec | null {
  const match = DICE.exec(notation);
  if (!match) return null;
  const count = Number(match[1]);
  const sides = Number(match[2]);
  if (count < 1 || count > 20 || sides < 2 || sides > 100) return null;
  return { count, sides };
}

export function rollDice(state: RngState, spec: DiceSpec): [roll: DiceRoll, next: RngState] {
  const rolls: number[] = [];
  let rng = state;
  for (let i = 0; i < spec.count; i++) {
    const [value, next] = rollDie(rng, spec.sides);
    rolls.push(value);
    rng = next;
  }
  return [{ rolls, total: rolls.reduce((sum, value) => sum + value, 0) }, rng];
}

/** Bornes théoriques d'un jet, utiles pour estimer une probabilité de réussite. */
export function diceRange(spec: DiceSpec): { min: number; max: number } {
  return { min: spec.count, max: spec.count * spec.sides };
}

/**
 * Distribution exacte de la somme de `count` dés à `sides` faces
 * (convolution) : `result[total] = probabilité`.
 */
export function diceDistribution(spec: DiceSpec): Map<number, number> {
  let distribution = new Map<number, number>([[0, 1]]);
  for (let die = 0; die < spec.count; die++) {
    const next = new Map<number, number>();
    for (const [total, probability] of distribution) {
      for (let face = 1; face <= spec.sides; face++) {
        next.set(total + face, (next.get(total + face) ?? 0) + probability / spec.sides);
      }
    }
    distribution = next;
  }
  return distribution;
}
