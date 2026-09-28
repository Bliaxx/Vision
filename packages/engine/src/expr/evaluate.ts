import type { Value } from '../format/types';
import type { Expr } from './ast';

/** Vue minimale de l'état de jeu nécessaire à l'évaluation d'une expression. */
export interface ExprScope {
  readonly vars: Readonly<Record<string, Value>>;
  readonly inventory: Readonly<Record<string, number>>;
  readonly visits: Readonly<Record<string, number>>;
  readonly achievements: readonly string[];
}

export function isTruthy(value: Value): boolean {
  if (typeof value === 'number') return value !== 0 && !Number.isNaN(value);
  if (typeof value === 'string') return value.length > 0;
  return value;
}

export function toNumber(value: Value): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function divide(left: number, right: number): number {
  return right === 0 ? 0 : left / right;
}

/**
 * Évalue une expression. L'évaluation est totale : elle ne lève jamais
 * d'exception (une division par zéro vaut 0, une variable inconnue vaut 0).
 * Les erreurs de typage sont détectées en amont par l'analyse statique.
 */
export function evaluate(expr: Expr, scope: ExprScope): Value {
  switch (expr.t) {
    case 'num':
    case 'str':
    case 'bool':
      return expr.v;
    case 'var':
      return scope.vars[expr.id] ?? 0;
    case 'has':
      return (scope.inventory[expr.item] ?? 0) >= expr.qty;
    case 'count':
      return scope.inventory[expr.item] ?? 0;
    case 'visited':
      return (scope.visits[expr.passage] ?? 0) > 0;
    case 'visits':
      return scope.visits[expr.passage] ?? 0;
    case 'unlocked':
      return scope.achievements.includes(expr.achievement);
    case 'not':
      return !isTruthy(evaluate(expr.e, scope));
    case 'neg':
      return -toNumber(evaluate(expr.e, scope));
    case 'call': {
      const args = expr.args.map((arg) => toNumber(evaluate(arg, scope)));
      const [a = 0, b = 0] = args;
      switch (expr.fn) {
        case 'min':
          return Math.min(a, b);
        case 'max':
          return Math.max(a, b);
        case 'abs':
          return Math.abs(a);
        case 'round':
          return Math.round(a);
        case 'floor':
          return Math.floor(a);
        case 'ceil':
          return Math.ceil(a);
      }
      break;
    }
    case 'bin': {
      if (expr.op === 'and') {
        return isTruthy(evaluate(expr.l, scope)) && isTruthy(evaluate(expr.r, scope));
      }
      if (expr.op === 'or') {
        return isTruthy(evaluate(expr.l, scope)) || isTruthy(evaluate(expr.r, scope));
      }
      const left = evaluate(expr.l, scope);
      const right = evaluate(expr.r, scope);
      switch (expr.op) {
        case '==':
          return left === right;
        case '!=':
          return left !== right;
        case '+':
          if (typeof left === 'string' || typeof right === 'string') {
            return `${left}${right}`;
          }
          return toNumber(left) + toNumber(right);
        case '-':
          return toNumber(left) - toNumber(right);
        case '*':
          return toNumber(left) * toNumber(right);
        case '/':
          return divide(toNumber(left), toNumber(right));
        case '%': {
          const divisor = toNumber(right);
          return divisor === 0 ? 0 : toNumber(left) % divisor;
        }
        case '<':
          return toNumber(left) < toNumber(right);
        case '<=':
          return toNumber(left) <= toNumber(right);
        case '>':
          return toNumber(left) > toNumber(right);
        case '>=':
          return toNumber(left) >= toNumber(right);
      }
    }
  }
  return 0;
}

export function evaluateCondition(expr: Expr, scope: ExprScope): boolean {
  return isTruthy(evaluate(expr, scope));
}

export function evaluateNumber(expr: Expr, scope: ExprScope): number {
  return toNumber(evaluate(expr, scope));
}

/** Formate une valeur pour l'affichage dans un texte (interpolation). */
export function formatValue(value: Value, locale = 'fr'): string {
  if (typeof value === 'number') {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  }
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  return value;
}
