/**
 * AST du langage d'expressions de Dédale.
 *
 * Exemples :
 *   `courage >= 3 and has lanterne`
 *   `visited crypte or unlocked brave`
 *   `max(endurance - 2, 0)`
 */
export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'and'
  | 'or';

export type FunctionName = 'min' | 'max' | 'abs' | 'round' | 'floor' | 'ceil';

export type Expr =
  | { readonly t: 'num'; readonly v: number }
  | { readonly t: 'str'; readonly v: string }
  | { readonly t: 'bool'; readonly v: boolean }
  | { readonly t: 'var'; readonly id: string }
  | { readonly t: 'has'; readonly item: string; readonly qty: number }
  | { readonly t: 'count'; readonly item: string }
  | { readonly t: 'visited'; readonly passage: string }
  | { readonly t: 'visits'; readonly passage: string }
  | { readonly t: 'unlocked'; readonly achievement: string }
  | { readonly t: 'not'; readonly e: Expr }
  | { readonly t: 'neg'; readonly e: Expr }
  | { readonly t: 'bin'; readonly op: BinaryOperator; readonly l: Expr; readonly r: Expr }
  | { readonly t: 'call'; readonly fn: FunctionName; readonly args: readonly Expr[] };

export const FUNCTION_ARITY: Readonly<Record<FunctionName, number>> = {
  min: 2,
  max: 2,
  abs: 1,
  round: 1,
  floor: 1,
  ceil: 1,
};

/** Priorité des opérateurs binaires (plus grand = plus fort). */
export const PRECEDENCE: Readonly<Record<BinaryOperator, number>> = {
  or: 1,
  and: 2,
  '==': 3,
  '!=': 3,
  '<': 3,
  '<=': 3,
  '>': 3,
  '>=': 3,
  '+': 4,
  '-': 4,
  '*': 5,
  '/': 5,
  '%': 5,
};

/** Références symboliques d'une expression, utiles à l'analyse statique. */
export interface ExprReferences {
  vars: Set<string>;
  items: Set<string>;
  passages: Set<string>;
  achievements: Set<string>;
}

export function collectReferences(expr: Expr, into?: ExprReferences): ExprReferences {
  const refs = into ?? {
    vars: new Set<string>(),
    items: new Set<string>(),
    passages: new Set<string>(),
    achievements: new Set<string>(),
  };
  switch (expr.t) {
    case 'var':
      refs.vars.add(expr.id);
      break;
    case 'has':
    case 'count':
      refs.items.add(expr.item);
      break;
    case 'visited':
    case 'visits':
      refs.passages.add(expr.passage);
      break;
    case 'unlocked':
      refs.achievements.add(expr.achievement);
      break;
    case 'not':
    case 'neg':
      collectReferences(expr.e, refs);
      break;
    case 'bin':
      collectReferences(expr.l, refs);
      collectReferences(expr.r, refs);
      break;
    case 'call':
      for (const arg of expr.args) collectReferences(arg, refs);
      break;
    case 'num':
    case 'str':
    case 'bool':
      break;
  }
  return refs;
}
