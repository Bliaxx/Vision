import type { Ending, Value, VariableType } from '../format/types';
import {
  type Block,
  blocksToPlainText,
  type Inline,
  renderInline,
  resolveTemplate,
  toBlocks,
} from '../markup/render';
import type { CompiledStory } from './compile';
import { choiceAvailability, encounterActions } from './engine';
import type { EnemyState, GameState } from './state';

export interface ChoiceView {
  readonly id: string;
  readonly inlines: readonly Inline[];
  readonly text: string;
  readonly available: boolean;
  readonly hint: string | null;
  readonly test: { readonly label: string | null; readonly dice: string } | null;
}

export interface StatView {
  readonly id: string;
  readonly name: string;
  readonly type: VariableType;
  readonly value: Value;
  readonly min: number | null;
  readonly max: number | null;
  readonly icon: string | null;
}

export interface ItemView {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly icon: string | null;
  readonly qty: number;
}

export interface EncounterView {
  readonly round: number;
  readonly enemies: readonly (EnemyState & {
    readonly active: boolean;
    readonly defeated: boolean;
  })[];
  readonly hero: { readonly skill: number; readonly stamina: number };
  readonly canFlee: boolean;
}

export interface GameView {
  readonly passage: {
    readonly id: string;
    readonly title: string;
    readonly blocks: readonly Block[];
    readonly plainText: string;
    readonly image: string | null;
    readonly checkpoint: boolean;
    readonly ending: Ending | null;
  };
  readonly choices: readonly ChoiceView[];
  readonly encounter: EncounterView | null;
  readonly stats: readonly StatView[];
  readonly inventory: readonly ItemView[];
  readonly status: GameState['status'];
  /** Passage sans issue (ni choix disponible, ni fin, ni combat). */
  readonly stuck: boolean;
}

/**
 * Projette l'état de jeu en un modèle de vue prêt à afficher, identique pour
 * le web et le mobile.
 */
export function getView(story: CompiledStory, state: GameState, locale = 'fr'): GameView {
  const passage = story.passages.get(state.passage);
  if (!passage) throw new Error(`passage introuvable : ${state.passage}`);

  const blocks = toBlocks(resolveTemplate(story.template(passage.text).nodes, state, locale));

  const choices: ChoiceView[] = [];
  if (!state.encounter && state.status === 'playing') {
    for (const choice of passage.choices) {
      const availability = choiceAvailability(story, state, choice);
      if (availability.status === 'spent') continue;
      if (availability.status === 'locked' && availability.display === 'hide') continue;
      const inlines = renderInline(story.template(choice.text).nodes, state, locale);
      choices.push({
        id: choice.id,
        inlines,
        text: inlines.map((inline) => (inline.type === 'text' ? inline.text : ' ')).join(''),
        available: availability.status === 'available',
        hint: availability.status === 'locked' ? (choice.lockedHint ?? null) : null,
        test: choice.test ? { label: choice.test.label ?? null, dice: choice.test.dice } : null,
      });
    }
  }

  let encounter: EncounterView | null = null;
  if (state.encounter && passage.encounter) {
    const current = state.encounter.current;
    encounter = {
      round: state.encounter.round,
      enemies: state.encounter.enemies.map((enemy, index) => ({
        ...enemy,
        active: index === current,
        defeated: enemy.stamina <= 0,
      })),
      hero: {
        skill: Number(state.vars[passage.encounter.skillVar] ?? 0),
        stamina: Number(state.vars[passage.encounter.staminaVar] ?? 0),
      },
      canFlee: encounterActions(story, state).flee,
    };
  }

  const stats: StatView[] = story.story.variables
    .filter((variable) => variable.visible)
    .map((variable) => ({
      id: variable.id,
      name: variable.name,
      type: variable.type,
      value: state.vars[variable.id] ?? variable.initial,
      min: variable.min ?? null,
      max: variable.max ?? null,
      icon: variable.icon ?? null,
    }));

  const inventory: ItemView[] = Object.entries(state.inventory)
    .filter(([, qty]) => qty > 0)
    .flatMap(([id, qty]) => {
      const item = story.items.get(id);
      if (!item || item.hidden) return [];
      return [
        {
          id,
          name: item.name,
          description: item.description ?? null,
          icon: item.icon ?? null,
          qty,
        },
      ];
    });

  return {
    passage: {
      id: passage.id,
      title: passage.title,
      blocks,
      plainText: blocksToPlainText(blocks),
      image: passage.image ?? null,
      checkpoint: passage.checkpoint,
      ending: passage.ending ?? null,
    },
    choices,
    encounter,
    stats,
    inventory,
    status: state.status,
    stuck:
      state.status === 'playing' && !state.encounter && !choices.some((choice) => choice.available),
  };
}
