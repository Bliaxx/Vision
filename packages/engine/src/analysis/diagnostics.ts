import { collectReferences } from '../expr/ast';
import { tryParseExpr } from '../expr/parser';
import { checkExpr, type ExprType, type TypeEnvironment, type TypeIssue } from '../expr/typecheck';
import type { Effect, Passage, Story } from '../format/types';
import { parseTemplate } from '../markup/template';
import { parseDice } from '../runtime/dice';
import { buildGraph, canReachEnding, reachableFromStart } from './graph';

export type Severity = 'error' | 'warning' | 'info';

export type DiagnosticCode =
  | 'duplicate_id'
  | 'start_missing'
  | 'broken_link'
  | 'unreachable_passage'
  | 'dead_end'
  | 'no_ending'
  | 'no_path_to_ending'
  | 'invalid_expression'
  | 'unknown_reference'
  | 'type_mismatch'
  | 'markup_error'
  | 'invalid_dice'
  | 'empty_passage'
  | 'encounter_with_choices'
  | 'invalid_encounter_variable'
  | 'ending_with_choices'
  | 'all_choices_conditional'
  | 'unused_variable'
  | 'unused_item';

export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly severity: Severity;
  readonly message: string;
  readonly passage?: string;
  readonly choice?: string;
  /** Symbole ou passage en cause. */
  readonly ref?: string;
}

export interface AnalysisReport {
  readonly diagnostics: readonly Diagnostic[];
  readonly errors: number;
  readonly warnings: number;
  /** Publiable si aucune erreur bloquante. */
  readonly publishable: boolean;
}

const SEVERITY: Readonly<Record<DiagnosticCode, Severity>> = {
  duplicate_id: 'error',
  start_missing: 'error',
  broken_link: 'error',
  unreachable_passage: 'warning',
  dead_end: 'error',
  no_ending: 'error',
  no_path_to_ending: 'warning',
  invalid_expression: 'error',
  unknown_reference: 'error',
  type_mismatch: 'warning',
  markup_error: 'error',
  invalid_dice: 'error',
  empty_passage: 'warning',
  encounter_with_choices: 'warning',
  invalid_encounter_variable: 'error',
  ending_with_choices: 'info',
  all_choices_conditional: 'warning',
  unused_variable: 'info',
  unused_item: 'info',
};

interface Location {
  passage?: string;
  choice?: string;
}

/**
 * Analyse statique complète d'un récit : cohérence du graphe, validité des
 * expressions et du balisage, références et types. C'est ce qui permet à
 * l'éditeur de signaler immédiatement branches orphelines et impasses, et au
 * serveur de refuser la publication d'un récit cassé.
 */
export function analyzeStory(story: Story): AnalysisReport {
  const diagnostics: Diagnostic[] = [];
  const report = (code: DiagnosticCode, message: string, location: Location = {}, ref?: string) => {
    diagnostics.push({
      code,
      severity: SEVERITY[code],
      message,
      ...location,
      ...(ref !== undefined ? { ref } : {}),
    });
  };

  const passageIds = new Set<string>();
  const variableTypes = new Map(story.variables.map((variable) => [variable.id, variable.type]));
  const itemIds = new Set(story.items.map((item) => item.id));
  const achievementIds = new Set(story.achievements.map((achievement) => achievement.id));
  const usedVariables = new Set<string>();
  const usedItems = new Set<string>();

  const checkDuplicates = (kind: string, ids: readonly string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) report('duplicate_id', `${kind} en double : ${id}`, {}, id);
      seen.add(id);
    }
  };
  checkDuplicates(
    'passage',
    story.passages.map((passage) => passage.id),
  );
  checkDuplicates(
    'variable',
    story.variables.map((variable) => variable.id),
  );
  checkDuplicates(
    'objet',
    story.items.map((item) => item.id),
  );
  checkDuplicates(
    'succès',
    story.achievements.map((achievement) => achievement.id),
  );
  for (const passage of story.passages) passageIds.add(passage.id);

  const env: TypeEnvironment = {
    varType: (id) => variableTypes.get(id),
    hasItem: (id) => itemIds.has(id),
    hasPassage: (id) => passageIds.has(id),
    hasAchievement: (id) => achievementIds.has(id),
  };

  const reportTypeIssues = (issues: readonly TypeIssue[], location: Location) => {
    for (const issue of issues) {
      switch (issue.code) {
        case 'unknown_var':
          report('unknown_reference', `variable inconnue : ${issue.ref}`, location, issue.ref);
          break;
        case 'unknown_item':
          report('unknown_reference', `objet inconnu : ${issue.ref}`, location, issue.ref);
          break;
        case 'unknown_passage':
          report('unknown_reference', `passage inconnu : ${issue.ref}`, location, issue.ref);
          break;
        case 'unknown_achievement':
          report('unknown_reference', `succès inconnu : ${issue.ref}`, location, issue.ref);
          break;
        case 'type_mismatch':
          report(
            'type_mismatch',
            `type incohérent : ${issue.found} au lieu de ${issue.expected}`,
            location,
          );
          break;
      }
    }
  };

  /** Analyse une expression textuelle ; retourne son type inféré. */
  const checkSource = (source: string, location: Location): ExprType => {
    const parsed = tryParseExpr(source);
    if (!parsed.ok) {
      report(
        'invalid_expression',
        `expression invalide « ${source} » : ${parsed.error.message}`,
        location,
      );
      return 'unknown';
    }
    const refs = collectReferences(parsed.expr);
    for (const id of refs.vars) usedVariables.add(id);
    for (const id of refs.items) usedItems.add(id);
    const { type, issues } = checkExpr(parsed.expr, env);
    reportTypeIssues(issues, location);
    return type;
  };

  const checkLink = (target: string, location: Location) => {
    if (!passageIds.has(target)) {
      report('broken_link', `lien vers un passage inexistant : ${target}`, location, target);
    }
  };

  const checkEffects = (effects: readonly Effect[], location: Location) => {
    for (const effect of effects) {
      switch (effect.kind) {
        case 'set':
        case 'add': {
          usedVariables.add(effect.var);
          const declared = variableTypes.get(effect.var);
          if (!declared) {
            report('unknown_reference', `variable inconnue : ${effect.var}`, location, effect.var);
          }
          const valueType = checkSource(effect.value, location);
          if (effect.kind === 'add' && declared === 'boolean') {
            report('type_mismatch', `impossible d'ajouter à un booléen : ${effect.var}`, location);
          } else if (declared && valueType !== 'unknown') {
            const expected = declared === 'text' ? 'text' : declared;
            if (effect.kind === 'set' && valueType !== expected) {
              report(
                'type_mismatch',
                `« ${effect.var} » attend une valeur ${expected}, reçu ${valueType}`,
                location,
              );
            }
          }
          break;
        }
        case 'give':
        case 'take':
          usedItems.add(effect.item);
          if (!itemIds.has(effect.item)) {
            report('unknown_reference', `objet inconnu : ${effect.item}`, location, effect.item);
          }
          break;
        case 'unlock':
          if (!achievementIds.has(effect.achievement)) {
            report(
              'unknown_reference',
              `succès inconnu : ${effect.achievement}`,
              location,
              effect.achievement,
            );
          }
          break;
      }
    }
  };

  const checkMarkup = (text: string, location: Location) => {
    const template = parseTemplate(text);
    for (const error of template.errors) {
      report('markup_error', `balisage : ${error.message}`, location);
    }
    for (const expr of template.expressions) {
      const refs = collectReferences(expr);
      for (const id of refs.vars) usedVariables.add(id);
      for (const id of refs.items) usedItems.add(id);
      reportTypeIssues(checkExpr(expr, env).issues, location);
    }
  };

  const checkPassage = (passage: Passage) => {
    const at: Location = { passage: passage.id };
    if (!passage.text.trim()) report('empty_passage', `passage sans texte : ${passage.title}`, at);
    checkMarkup(passage.text, at);
    checkEffects(passage.onEnter, at);

    if (passage.ending && passage.choices.length > 0) {
      report('ending_with_choices', 'les choix d’un passage de fin sont ignorés', at);
    }

    for (const choice of passage.choices) {
      const location: Location = { passage: passage.id, choice: choice.id };
      checkMarkup(choice.text, location);
      if (choice.condition) {
        const type = checkSource(choice.condition, location);
        if (type !== 'unknown' && type !== 'boolean') {
          report('type_mismatch', 'une condition doit être booléenne', location);
        }
      }
      checkEffects(choice.effects, location);
      if (choice.test) {
        if (!parseDice(choice.test.dice)) {
          report('invalid_dice', `notation de dés invalide : ${choice.test.dice}`, location);
        }
        checkSource(choice.test.target, location);
        if (choice.test.modifier) checkSource(choice.test.modifier, location);
        checkEffects(choice.test.effects, location);
        for (const outcome of [choice.test.success, choice.test.failure]) {
          checkLink(outcome.to, location);
          checkEffects(outcome.effects, location);
        }
      } else if (choice.to) {
        checkLink(choice.to, location);
      }
    }

    if (passage.encounter) {
      const { encounter } = passage;
      for (const id of [encounter.skillVar, encounter.staminaVar]) {
        usedVariables.add(id);
        if (variableTypes.get(id) !== 'number') {
          report(
            'invalid_encounter_variable',
            `le combat requiert une variable numérique : ${id}`,
            at,
            id,
          );
        }
      }
      for (const outcome of [encounter.victory, encounter.defeat]) {
        checkLink(outcome.to, at);
        checkEffects(outcome.effects, at);
      }
      if (encounter.flee) {
        checkLink(encounter.flee.to, at);
        checkEffects(encounter.flee.effects, at);
      }
      if (passage.choices.length > 0) {
        report('encounter_with_choices', 'les choix sont masqués pendant un combat', at);
      }
    }

    if (!passage.ending && !passage.encounter) {
      if (passage.choices.length === 0) {
        report('dead_end', `impasse : « ${passage.title} » n'a ni choix ni fin`, at);
      } else if (passage.choices.every((choice) => choice.condition)) {
        report(
          'all_choices_conditional',
          'tous les choix sont conditionnels : le lecteur peut rester bloqué',
          at,
        );
      }
    }
  };

  if (!passageIds.has(story.start)) {
    report('start_missing', `passage de départ introuvable : ${story.start}`, {}, story.start);
  }
  for (const passage of story.passages) checkPassage(passage);
  for (const rule of story.rules) {
    checkSource(rule.when, {});
    checkLink(rule.goto, {});
  }

  if (!story.passages.some((passage) => passage.ending)) {
    report('no_ending', 'le récit ne comporte aucune fin');
  }

  if (passageIds.has(story.start)) {
    const graph = buildGraph(story);
    const reachable = reachableFromStart(story, graph);
    const toEnding = canReachEnding(story, graph);
    const hasEnding = story.passages.some((passage) => passage.ending);
    for (const passage of story.passages) {
      if (!reachable.has(passage.id)) {
        report(
          'unreachable_passage',
          `passage orphelin : « ${passage.title} » n'est jamais atteint`,
          { passage: passage.id },
        );
      } else if (hasEnding && !toEnding.has(passage.id) && !passage.ending) {
        const deadEndAlreadyReported = !passage.encounter && passage.choices.length === 0;
        if (!deadEndAlreadyReported) {
          report('no_path_to_ending', `aucune fin n'est atteignable depuis « ${passage.title} »`, {
            passage: passage.id,
          });
        }
      }
    }
  }

  for (const variable of story.variables) {
    if (!usedVariables.has(variable.id) && !variable.visible) {
      report('unused_variable', `variable jamais utilisée : ${variable.name}`, {}, variable.id);
    }
  }
  for (const item of story.items) {
    if (!usedItems.has(item.id)) {
      report('unused_item', `objet jamais utilisé : ${item.name}`, {}, item.id);
    }
  }

  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length;
  return { diagnostics, errors, warnings, publishable: errors === 0 };
}
