import type { z } from 'zod';
import type {
  AchievementSchema,
  ChoiceSchema,
  CompareSchema,
  EffectSchema,
  EncounterSchema,
  EndingKindSchema,
  EndingSchema,
  EnemySchema,
  ItemSchema,
  OutcomeSchema,
  PassageSchema,
  RewindPolicySchema,
  RuleSchema,
  SettingsSchema,
  StorySchema,
  TestSchema,
  VariableSchema,
  VariableTypeSchema,
} from './schema';

/** Récit normalisé (valeurs par défaut appliquées). */
export type Story = z.output<typeof StorySchema>;
/** Récit tel qu'écrit par un auteur ou importé (champs par défaut optionnels). */
export type StoryInput = z.input<typeof StorySchema>;

export type Passage = z.output<typeof PassageSchema>;
export type Choice = z.output<typeof ChoiceSchema>;
export type Effect = z.output<typeof EffectSchema>;
export type Outcome = z.output<typeof OutcomeSchema>;
export type Test = z.output<typeof TestSchema>;
export type Compare = z.output<typeof CompareSchema>;
export type Encounter = z.output<typeof EncounterSchema>;
export type Enemy = z.output<typeof EnemySchema>;
export type Ending = z.output<typeof EndingSchema>;
export type EndingKind = z.output<typeof EndingKindSchema>;
export type Variable = z.output<typeof VariableSchema>;
export type VariableType = z.output<typeof VariableTypeSchema>;
export type Item = z.output<typeof ItemSchema>;
export type Achievement = z.output<typeof AchievementSchema>;
export type Rule = z.output<typeof RuleSchema>;
export type Settings = z.output<typeof SettingsSchema>;
export type RewindPolicy = z.output<typeof RewindPolicySchema>;

/** Valeur d'une variable à l'exécution. */
export type Value = number | boolean | string;
