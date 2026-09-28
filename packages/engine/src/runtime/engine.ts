import { evaluate, evaluateCondition, evaluateNumber, isTruthy, toNumber } from '../expr/evaluate';
import type { Choice, Compare, Effect, Outcome, Passage, Test, Value } from '../format/types';
import type { CompiledStory } from './compile';
import { parseDice, rollDice } from './dice';
import type { EngineEvent } from './events';
import { seedRng } from './rng';
import { choiceKey, type DraftState, type GameState, toDraft } from './state';

export type Action = { type: 'choose'; choice: string } | { type: 'attack' } | { type: 'flee' };

export type EngineErrorCode =
  | 'unknown_passage'
  | 'choice_unavailable'
  | 'no_encounter'
  | 'encounter_in_progress'
  | 'cannot_flee'
  | 'game_over'
  | 'invalid_dice'
  | 'redirect_loop';

export class EngineError extends Error {
  readonly code: EngineErrorCode;
  constructor(code: EngineErrorCode, message: string) {
    super(message);
    this.name = 'EngineError';
    this.code = code;
  }
}

export interface Transition {
  readonly state: GameState;
  readonly events: readonly EngineEvent[];
}

/** Nombre maximal de redirections (règles globales) enchaînées par action. */
const MAX_REDIRECTS = 16;

/**
 * Transition d'état : mutations d'une copie de travail + journal
 * d'événements. Encapsulé ici pour que l'API publique reste purement
 * fonctionnelle (`createGame`, `applyAction`).
 */
class Transaction {
  readonly events: EngineEvent[] = [];
  readonly draft: DraftState;

  constructor(
    private readonly story: CompiledStory,
    state: GameState,
  ) {
    this.draft = toDraft(state);
  }

  passage(id: string): Passage {
    const passage = this.story.passages.get(id);
    if (!passage) throw new EngineError('unknown_passage', `passage introuvable : ${id}`);
    return passage;
  }

  // --- Effets -------------------------------------------------------------

  applyEffects(effects: readonly Effect[]): void {
    for (const effect of effects) this.applyEffect(effect);
  }

  private applyEffect(effect: Effect): void {
    const { draft } = this;
    switch (effect.kind) {
      case 'set':
      case 'add': {
        const variable = this.story.variables.get(effect.var);
        const from = draft.vars[effect.var] ?? variable?.initial ?? 0;
        const operand = evaluate(this.story.expr(effect.value), draft);
        const raw =
          effect.kind === 'set'
            ? operand
            : typeof from === 'string'
              ? `${from}${operand}`
              : toNumber(from) + toNumber(operand);
        const to = this.coerce(effect.var, raw);
        if (to !== from) {
          draft.vars[effect.var] = to;
          this.events.push({ type: 'var:changed', var: effect.var, from, to });
        }
        break;
      }
      case 'give': {
        const item = this.story.items.get(effect.item);
        const current = draft.inventory[effect.item] ?? 0;
        const next = item && !item.stackable ? 1 : current + effect.qty;
        if (next !== current) {
          draft.inventory[effect.item] = next;
          this.events.push({ type: 'item:gained', item: effect.item, qty: next - current });
        }
        break;
      }
      case 'take': {
        const current = draft.inventory[effect.item] ?? 0;
        const removed = Math.min(current, effect.qty);
        if (removed > 0) {
          const next = current - removed;
          if (next === 0) delete draft.inventory[effect.item];
          else draft.inventory[effect.item] = next;
          this.events.push({ type: 'item:lost', item: effect.item, qty: removed });
        }
        break;
      }
      case 'unlock':
        if (!draft.achievements.includes(effect.achievement)) {
          draft.achievements.push(effect.achievement);
          this.events.push({ type: 'achievement:unlocked', achievement: effect.achievement });
        }
        break;
    }
  }

  /** Respecte le type déclaré de la variable et ses bornes. */
  private coerce(id: string, value: Value): Value {
    const variable = this.story.variables.get(id);
    if (!variable) return value;
    switch (variable.type) {
      case 'number': {
        let number = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(number)) number = 0;
        if (variable.min !== undefined) number = Math.max(variable.min, number);
        if (variable.max !== undefined) number = Math.min(variable.max, number);
        return number;
      }
      case 'boolean':
        return isTruthy(value);
      case 'text':
        return String(value);
    }
  }

  // --- Navigation ---------------------------------------------------------

  enter(id: string): void {
    const passage = this.passage(id);
    const { draft } = this;
    draft.passage = id;
    draft.visits[id] = (draft.visits[id] ?? 0) + 1;
    draft.path.push(id);
    this.events.push({ type: 'passage:entered', passage: id });
    this.applyEffects(passage.onEnter);

    if (passage.ending) {
      draft.status = 'ended';
      draft.ending = { passage: id, kind: passage.ending.kind, title: passage.ending.title };
      draft.encounter = null;
      this.events.push({
        type: 'ending:reached',
        passage: id,
        kind: passage.ending.kind,
        title: passage.ending.title,
      });
      return;
    }

    if (passage.encounter) {
      draft.encounter = {
        current: 0,
        round: 0,
        enemies: passage.encounter.enemies.map((enemy) => ({
          id: enemy.id,
          name: enemy.name,
          skill: enemy.skill,
          stamina: enemy.stamina,
          maxStamina: enemy.stamina,
        })),
      };
      this.events.push({
        type: 'combat:started',
        enemies: passage.encounter.enemies.map((enemy) => enemy.id),
      });
    } else {
      draft.encounter = null;
    }
  }

  resolveOutcome(outcome: Outcome): void {
    this.applyEffects(outcome.effects);
    this.enter(outcome.to);
  }

  /** Évalue les règles globales jusqu'à stabilisation. */
  settle(): void {
    const { draft } = this;
    for (let redirects = 0; draft.status === 'playing'; redirects++) {
      const rule = this.story.story.rules.find(
        (candidate) =>
          candidate.goto !== draft.passage &&
          !(candidate.once && draft.firedRules.includes(candidate.id)) &&
          evaluateCondition(this.story.expr(candidate.when), draft),
      );
      if (!rule) return;
      if (redirects >= MAX_REDIRECTS) {
        throw new EngineError('redirect_loop', 'boucle de règles globales détectée');
      }
      if (rule.once) draft.firedRules.push(rule.id);
      this.events.push({ type: 'rule:triggered', rule: rule.id, to: rule.goto });
      this.enter(rule.goto);
    }
  }

  // --- Épreuves -----------------------------------------------------------

  runTest(test: Test): void {
    const spec = parseDice(test.dice);
    if (!spec) throw new EngineError('invalid_dice', `notation de dés invalide : ${test.dice}`);
    const [roll, rng] = rollDice(this.draft.rng, spec);
    this.draft.rng = rng;
    const modifier = test.modifier ? evaluateNumber(this.story.expr(test.modifier), this.draft) : 0;
    const target = evaluateNumber(this.story.expr(test.target), this.draft);
    const total = roll.total + modifier;
    const success = compare(total, test.compare, target);
    this.events.push({
      type: 'dice:rolled',
      label: test.label ?? null,
      dice: test.dice,
      rolls: roll.rolls,
      modifier,
      total,
      compare: test.compare,
      target,
      success,
    });
    this.applyEffects(test.effects);
    const outcome = success ? test.success : test.failure;
    this.events.push({ type: 'test:resolved', success, text: outcome.text ?? null });
    this.resolveOutcome(outcome);
  }

  // --- Combat -------------------------------------------------------------

  attack(): void {
    const { draft } = this;
    const encounterState = draft.encounter;
    const encounter = this.passage(draft.passage).encounter;
    if (!encounterState || !encounter)
      throw new EngineError('no_encounter', 'aucun combat en cours');
    const enemy = encounterState.enemies[encounterState.current];
    if (!enemy) throw new EngineError('no_encounter', 'aucun adversaire');

    const spec = { count: 2, sides: 6 };
    const [heroRoll, rngAfterHero] = rollDice(draft.rng, spec);
    const [enemyRoll, rngAfterEnemy] = rollDice(rngAfterHero, spec);
    draft.rng = rngAfterEnemy;

    const heroSkill = Number(draft.vars[encounter.skillVar] ?? 0);
    const heroAttack = heroRoll.total + heroSkill;
    const enemyAttack = enemyRoll.total + enemy.skill;
    const winner = heroAttack > enemyAttack ? 'hero' : enemyAttack > heroAttack ? 'enemy' : 'tie';

    let enemyStamina = enemy.stamina;
    if (winner === 'hero') enemyStamina = Math.max(0, enemy.stamina - encounter.damage);
    if (winner === 'enemy') {
      this.applyEffects([
        { kind: 'add', var: encounter.staminaVar, value: String(-encounter.enemyDamage) },
      ]);
    }
    const heroStamina = Number(draft.vars[encounter.staminaVar] ?? 0);
    const round = encounterState.round + 1;
    const enemies = encounterState.enemies.map((candidate, index) =>
      index === encounterState.current ? { ...candidate, stamina: enemyStamina } : candidate,
    );
    draft.encounter = { ...encounterState, round, enemies };

    this.events.push({
      type: 'combat:round',
      round,
      enemy: enemy.id,
      heroRolls: heroRoll.rolls,
      enemyRolls: enemyRoll.rolls,
      heroAttack,
      enemyAttack,
      winner,
      heroStamina,
      enemyStamina,
    });

    if (heroStamina <= 0) {
      draft.encounter = null;
      this.events.push({ type: 'combat:ended', outcome: 'defeat' });
      this.resolveOutcome(encounter.defeat);
      return;
    }
    if (enemyStamina <= 0) {
      this.events.push({ type: 'combat:enemy-defeated', enemy: enemy.id });
      const next = encounterState.current + 1;
      if (next >= enemies.length) {
        draft.encounter = null;
        this.events.push({ type: 'combat:ended', outcome: 'victory' });
        this.resolveOutcome(encounter.victory);
      } else {
        draft.encounter = { current: next, round: 0, enemies };
      }
    }
  }

  flee(): void {
    const { draft } = this;
    const encounter = this.passage(draft.passage).encounter;
    if (!draft.encounter || !encounter)
      throw new EngineError('no_encounter', 'aucun combat en cours');
    if (!canFlee(encounter, draft.encounter.round)) {
      throw new EngineError('cannot_flee', 'la fuite est impossible pour le moment');
    }
    const flee = encounter.flee as NonNullable<typeof encounter.flee>;
    if (flee.damage > 0) {
      this.applyEffects([{ kind: 'add', var: encounter.staminaVar, value: String(-flee.damage) }]);
    }
    draft.encounter = null;
    if (Number(draft.vars[encounter.staminaVar] ?? 0) <= 0) {
      this.events.push({ type: 'combat:ended', outcome: 'defeat' });
      this.resolveOutcome(encounter.defeat);
      return;
    }
    this.events.push({ type: 'combat:ended', outcome: 'fled' });
    this.applyEffects(flee.effects);
    this.enter(flee.to);
  }

  commit(): Transition {
    this.draft.step += 1;
    return { state: this.draft, events: this.events };
  }
}

export function compare(value: number, operator: Compare, target: number): boolean {
  switch (operator) {
    case 'lte':
      return value <= target;
    case 'lt':
      return value < target;
    case 'gte':
      return value >= target;
    case 'gt':
      return value > target;
    case 'eq':
      return value === target;
  }
}

function canFlee(encounter: NonNullable<Passage['encounter']>, round: number): boolean {
  return encounter.flee !== undefined && round >= encounter.flee.afterRound;
}

/** Démarre une partie : variables initiales, entrée dans le passage de départ. */
export function createGame(story: CompiledStory, seed: number): Transition {
  const vars: Record<string, Value> = {};
  for (const variable of story.story.variables) vars[variable.id] = variable.initial;
  const initial: GameState = {
    v: 1,
    seed: seed >>> 0,
    rng: seedRng(seed),
    passage: story.story.start,
    vars,
    inventory: {},
    visits: {},
    achievements: [],
    taken: [],
    firedRules: [],
    path: [],
    encounter: null,
    status: 'playing',
    ending: null,
    step: 0,
  };
  const transaction = new Transaction(story, initial);
  transaction.enter(story.story.start);
  transaction.settle();
  return { state: transaction.draft, events: transaction.events };
}

export type ChoiceAvailability =
  | { status: 'available' }
  | { status: 'locked'; display: 'hide' | 'show' }
  | { status: 'spent' };

/** Disponibilité d'un choix dans l'état courant. */
export function choiceAvailability(
  story: CompiledStory,
  state: GameState,
  choice: Choice,
): ChoiceAvailability {
  if (choice.once && state.taken.includes(choiceKey(state.passage, choice.id))) {
    return { status: 'spent' };
  }
  if (choice.condition && !evaluateCondition(story.expr(choice.condition), state)) {
    return { status: 'locked', display: choice.locked ?? story.story.settings.lockedChoices };
  }
  return { status: 'available' };
}

/** Applique une action du lecteur. Lève `EngineError` si l'action est invalide. */
export function applyAction(story: CompiledStory, state: GameState, action: Action): Transition {
  if (state.status === 'ended') throw new EngineError('game_over', 'la partie est terminée');
  const transaction = new Transaction(story, state);

  switch (action.type) {
    case 'choose': {
      if (state.encounter) {
        throw new EngineError('encounter_in_progress', 'un combat est en cours');
      }
      const passage = transaction.passage(state.passage);
      const choice = passage.choices.find((candidate) => candidate.id === action.choice);
      if (!choice || choiceAvailability(story, state, choice).status !== 'available') {
        throw new EngineError('choice_unavailable', `choix indisponible : ${action.choice}`);
      }
      transaction.events.push({ type: 'choice:made', passage: passage.id, choice: choice.id });
      if (choice.once) transaction.draft.taken.push(choiceKey(passage.id, choice.id));
      transaction.applyEffects(choice.effects);
      if (choice.test) transaction.runTest(choice.test);
      else if (choice.to) transaction.enter(choice.to);
      break;
    }
    case 'attack':
      transaction.attack();
      break;
    case 'flee':
      transaction.flee();
      break;
  }

  transaction.settle();
  return transaction.commit();
}

/** Actions de combat possibles dans l'état courant. */
export function encounterActions(
  story: CompiledStory,
  state: GameState,
): { attack: boolean; flee: boolean } {
  const encounter = story.passages.get(state.passage)?.encounter;
  if (!state.encounter || !encounter) return { attack: false, flee: false };
  return { attack: true, flee: canFlee(encounter, state.encounter.round) };
}

/** Évalue une expression dans l'état de jeu (débogage, mode test de l'éditeur). */
export function evaluateInState(story: CompiledStory, state: GameState, source: string): Value {
  return evaluate(story.expr(source), state);
}
