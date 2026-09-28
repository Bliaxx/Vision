import { type BinaryOperator, type Expr, PRECEDENCE } from './ast';

const UNARY_PRECEDENCE = 6;

function precedenceOf(expr: Expr): number {
  if (expr.t === 'bin') return PRECEDENCE[expr.op];
  if (expr.t === 'not') return 2.5;
  if (expr.t === 'neg') return UNARY_PRECEDENCE;
  return 10;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
}

function wrap(expr: Expr, minPrecedence: number): string {
  const text = printExpr(expr);
  return precedenceOf(expr) < minPrecedence ? `(${text})` : text;
}

const NON_ASSOCIATIVE: ReadonlySet<BinaryOperator> = new Set(['-', '/', '%']);

/**
 * Imprime une expression sous sa forme canonique, avec le minimum de
 * parenthèses. `parseExpr(printExpr(e))` est structurellement égal à `e`.
 */
export function printExpr(expr: Expr): string {
  switch (expr.t) {
    case 'num':
      return formatNumber(expr.v);
    case 'str':
      return `"${expr.v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    case 'bool':
      return expr.v ? 'true' : 'false';
    case 'var':
      return expr.id;
    case 'has':
      return expr.qty > 1 ? `has ${expr.item} ${expr.qty}` : `has ${expr.item}`;
    case 'count':
      return `count(${expr.item})`;
    case 'visited':
      return `visited ${expr.passage}`;
    case 'visits':
      return `visits(${expr.passage})`;
    case 'unlocked':
      return `unlocked ${expr.achievement}`;
    case 'not':
      return `not ${wrap(expr.e, 3)}`;
    case 'neg':
      return `-${wrap(expr.e, UNARY_PRECEDENCE)}`;
    case 'call':
      return `${expr.fn}(${expr.args.map((arg) => printExpr(arg)).join(', ')})`;
    case 'bin': {
      const precedence = PRECEDENCE[expr.op];
      const isComparison = precedence === 3;
      const left = wrap(expr.l, isComparison ? precedence + 1 : precedence);
      const rightMin = NON_ASSOCIATIVE.has(expr.op) || isComparison ? precedence + 1 : precedence;
      const right = wrap(expr.r, rightMin);
      return `${left} ${expr.op} ${right}`;
    }
  }
}
