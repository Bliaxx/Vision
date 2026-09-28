import type { Expr } from '../expr/ast';
import { type ExprError, tryParseExpr } from '../expr/parser';
import type { Achievement, Item, Passage, Story, Variable } from '../format/types';
import { type ParsedTemplate, parseTemplate } from '../markup/template';

/**
 * Récit « compilé » : index par identifiant et caches d'analyse des
 * expressions et gabarits. Construit une fois par version de récit, puis
 * partagé par toutes les parties (lecture, simulation, vérification).
 */
export interface CompiledStory {
  readonly story: Story;
  readonly passages: ReadonlyMap<string, Passage>;
  readonly variables: ReadonlyMap<string, Variable>;
  readonly items: ReadonlyMap<string, Item>;
  readonly achievements: ReadonlyMap<string, Achievement>;
  /** Expression analysée (mise en cache). Une expression invalide vaut `false`. */
  expr(source: string): Expr;
  /** Erreur de syntaxe éventuelle d'une expression. */
  exprError(source: string): ExprError | null;
  /** Gabarit analysé (mise en cache). */
  template(source: string): ParsedTemplate;
}

const FALSE: Expr = { t: 'bool', v: false };

function indexBy<T extends { id: string }>(entries: readonly T[]): Map<string, T> {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

export function compileStory(story: Story): CompiledStory {
  const expressions = new Map<string, { expr: Expr; error: ExprError | null }>();
  const templates = new Map<string, ParsedTemplate>();

  const resolveExpr = (source: string) => {
    let entry = expressions.get(source);
    if (!entry) {
      const result = tryParseExpr(source);
      entry = result.ok ? { expr: result.expr, error: null } : { expr: FALSE, error: result.error };
      expressions.set(source, entry);
    }
    return entry;
  };

  return {
    story,
    passages: indexBy(story.passages),
    variables: indexBy(story.variables),
    items: indexBy(story.items),
    achievements: indexBy(story.achievements),
    expr: (source) => resolveExpr(source).expr,
    exprError: (source) => resolveExpr(source).error,
    template: (source) => {
      let template = templates.get(source);
      if (!template) {
        template = parseTemplate(source);
        templates.set(source, template);
      }
      return template;
    },
  };
}
