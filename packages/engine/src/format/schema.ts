/**
 * Dédale Story Format (DSF) — version 1.
 *
 * Un récit interactif est un document JSON autonome, lisible par un humain et
 * versionnable. Les conditions et valeurs sont exprimées dans un petit langage
 * textuel (voir `expr/`) plutôt que sous forme d'AST : le format reste
 * écrivable à la main, compact et stable dans le temps.
 *
 * Ce schéma est la source de vérité unique : les types TypeScript en sont
 * inférés et il valide toute donnée non fiable (import, API, stockage local).
 */
import { z } from 'zod';
import { RESERVED_WORDS } from '../expr/parser';

export const STORY_FORMAT = 'dedale-story';
export const STORY_FORMAT_VERSION = 1;

/** Identifiant stable d'un nœud du récit (passage, choix, règle). */
export const IdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z_][A-Za-z0-9_-]*$/, 'identifiant invalide');

/**
 * Identifiant d'un symbole utilisable dans une expression (variable, objet,
 * succès, ennemi). Le tiret est exclu pour lever toute ambiguïté avec la
 * soustraction : `or-2` s'écrit `or - 2`.
 */
export const SymbolIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'identifiant de symbole invalide (lettres, chiffres, _)')
  .refine((id) => !RESERVED_WORDS.has(id.toLowerCase()), {
    message: 'mot réservé du langage (and, or, not, has…) : choisissez un autre identifiant',
  });

/** Expression textuelle, ex. `habilete + 2`, `has lanterne and courage >= 3`. */
export const ExpressionSchema = z.string().trim().min(1).max(500);

export const EndingKindSchema = z.enum(['victory', 'defeat', 'death', 'neutral', 'secret']);

export const LockedDisplaySchema = z.enum(['hide', 'show']);

export const VariableTypeSchema = z.enum(['number', 'boolean', 'text']);

export const VariableSchema = z
  .object({
    id: SymbolIdSchema,
    name: z.string().min(1).max(60),
    type: VariableTypeSchema,
    initial: z.union([z.number(), z.boolean(), z.string().max(200)]),
    min: z.number().optional(),
    max: z.number().optional(),
    /** Affichée sur la feuille d'aventure du lecteur. */
    visible: z.boolean().default(true),
    description: z.string().max(280).optional(),
    icon: z.string().max(40).optional(),
  })
  .superRefine((variable, ctx) => {
    const expected = { number: 'number', boolean: 'boolean', text: 'string' } as const;
    if (typeof variable.initial !== expected[variable.type]) {
      ctx.addIssue({
        code: 'custom',
        path: ['initial'],
        message: `la valeur initiale doit être de type ${variable.type}`,
      });
    }
    if (variable.min !== undefined && variable.max !== undefined && variable.min > variable.max) {
      ctx.addIssue({ code: 'custom', path: ['min'], message: 'min doit être ≤ max' });
    }
  });

export const ItemSchema = z.object({
  id: SymbolIdSchema,
  name: z.string().min(1).max(60),
  description: z.string().max(280).optional(),
  icon: z.string().max(40).optional(),
  stackable: z.boolean().default(false),
  /** Objet de quête invisible dans l'inventaire (drapeau narratif). */
  hidden: z.boolean().default(false),
});

export const AchievementSchema = z.object({
  id: SymbolIdSchema,
  name: z.string().min(1).max(80),
  description: z.string().max(280).default(''),
  icon: z.string().max(40).optional(),
  /** Masqué tant qu'il n'est pas débloqué. */
  secret: z.boolean().default(false),
});

export const EffectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('set'), var: SymbolIdSchema, value: ExpressionSchema }),
  z.object({ kind: z.literal('add'), var: SymbolIdSchema, value: ExpressionSchema }),
  z.object({
    kind: z.literal('give'),
    item: SymbolIdSchema,
    qty: z.number().int().min(1).default(1),
  }),
  z.object({
    kind: z.literal('take'),
    item: SymbolIdSchema,
    qty: z.number().int().min(1).default(1),
  }),
  z.object({ kind: z.literal('unlock'), achievement: SymbolIdSchema }),
]);

export const OutcomeSchema = z.object({
  to: IdSchema,
  effects: z.array(EffectSchema).default([]),
  /** Court retour affiché au lecteur (« Vous avez de la chance ! »). */
  text: z.string().max(200).optional(),
});

export const CompareSchema = z.enum(['lte', 'lt', 'gte', 'gt', 'eq']);

/** Épreuve de dés : `jet (+ modificateur)` comparé à `target`. */
export const TestSchema = z.object({
  label: z.string().max(80).optional(),
  dice: z.string().regex(/^\s*\d{1,2}\s*d\s*\d{1,3}\s*$/i, 'notation de dés invalide (ex. 2d6)'),
  compare: CompareSchema,
  target: ExpressionSchema,
  modifier: ExpressionSchema.optional(),
  success: OutcomeSchema,
  failure: OutcomeSchema,
  /** Effets appliqués quel que soit le résultat (ex. `chance -= 1`). */
  effects: z.array(EffectSchema).default([]),
});

export const ChoiceSchema = z
  .object({
    id: IdSchema,
    text: z.string().min(1).max(300),
    to: IdSchema.optional(),
    condition: ExpressionSchema.optional(),
    locked: LockedDisplaySchema.optional(),
    lockedHint: z.string().max(160).optional(),
    effects: z.array(EffectSchema).default([]),
    test: TestSchema.optional(),
    /** Le choix disparaît une fois emprunté (ex. « Fouiller le coffre »). */
    once: z.boolean().default(false),
  })
  .refine((choice) => choice.to !== undefined || choice.test !== undefined, {
    message: 'un choix doit mener à un passage ou déclencher une épreuve',
    path: ['to'],
  });

export const EnemySchema = z.object({
  id: SymbolIdSchema,
  name: z.string().min(1).max(60),
  skill: z.number().int().min(0).max(99),
  stamina: z.number().int().min(1).max(999),
});

/**
 * Module « Combat » inspiré des livres-jeux classiques : à chaque assaut,
 * chaque camp lance 2d6 + habileté ; le plus fort inflige des dégâts.
 */
export const EncounterSchema = z.object({
  enemies: z.array(EnemySchema).min(1).max(8),
  skillVar: SymbolIdSchema,
  staminaVar: SymbolIdSchema,
  /** Dégâts infligés à l'ennemi quand le héros gagne l'assaut. */
  damage: z.number().int().min(1).max(99).default(2),
  /** Dégâts subis par le héros quand il perd l'assaut. */
  enemyDamage: z.number().int().min(1).max(99).default(2),
  victory: OutcomeSchema,
  defeat: OutcomeSchema,
  flee: z
    .object({
      to: IdSchema,
      damage: z.number().int().min(0).max(99).default(2),
      /** Nombre d'assauts minimum avant de pouvoir fuir. */
      afterRound: z.number().int().min(0).default(0),
      effects: z.array(EffectSchema).default([]),
    })
    .optional(),
});

export const EndingSchema = z.object({
  kind: EndingKindSchema,
  title: z.string().min(1).max(80),
});

export const PositionSchema = z.object({ x: z.number(), y: z.number() });

export const PassageSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(120),
  text: z.string().max(20_000).default(''),
  tags: z.array(z.string().max(40)).max(20).default([]),
  ending: EndingSchema.optional(),
  checkpoint: z.boolean().default(false),
  onEnter: z.array(EffectSchema).default([]),
  choices: z.array(ChoiceSchema).max(20).default([]),
  encounter: EncounterSchema.optional(),
  image: z.url().optional(),
  position: PositionSchema.optional(),
  /** Notes privées de l'auteur, jamais montrées aux lecteurs. */
  notes: z.string().max(5_000).optional(),
});

/** Règle globale évaluée après chaque changement d'état (ex. `endurance <= 0` → mort). */
export const RuleSchema = z.object({
  id: IdSchema,
  when: ExpressionSchema,
  goto: IdSchema,
  once: z.boolean().default(true),
});

export const RewindPolicySchema = z.enum(['free', 'checkpoint', 'none']);

export const SettingsSchema = z.object({
  /** `free` : retour à n'importe quel choix ; `checkpoint` : aux points de sauvegarde ; `none` : mode puriste. */
  rewind: RewindPolicySchema.default('free'),
  /** Affiche « 62 % des lecteurs ont fait ce choix » après chaque décision. */
  showChoiceStats: z.boolean().default(true),
  /** Affichage par défaut des choix verrouillés. */
  lockedChoices: LockedDisplaySchema.default('show'),
});

export const StorySchema = z.object({
  format: z.literal(STORY_FORMAT).default(STORY_FORMAT),
  formatVersion: z.literal(STORY_FORMAT_VERSION).default(STORY_FORMAT_VERSION),
  title: z.string().min(1).max(120),
  language: z.string().min(2).max(12).default('fr'),
  start: IdSchema,
  variables: z.array(VariableSchema).max(100).default([]),
  items: z.array(ItemSchema).max(200).default([]),
  achievements: z.array(AchievementSchema).max(100).default([]),
  rules: z.array(RuleSchema).max(50).default([]),
  settings: SettingsSchema.default({
    rewind: 'free',
    showChoiceStats: true,
    lockedChoices: 'show',
  }),
  passages: z.array(PassageSchema).min(1).max(5_000),
});
