import type { VariableType } from '../format/types';
import type { Expr } from './ast';

export type ExprType = 'number' | 'boolean' | 'text' | 'unknown';

export type TypeIssue =
  | { code: 'unknown_var'; ref: string }
  | { code: 'unknown_item'; ref: string }
  | { code: 'unknown_passage'; ref: string }
  | { code: 'unknown_achievement'; ref: string }
  | { code: 'type_mismatch'; expected: ExprType; found: ExprType };

/** Symboles connus du récit, fournis par l'analyse statique. */
export interface TypeEnvironment {
  varType(id: string): VariableType | undefined;
  hasItem(id: string): boolean;
  hasPassage(id: string): boolean;
  hasAchievement(id: string): boolean;
}

const FROM_VARIABLE: Readonly<Record<VariableType, ExprType>> = {
  number: 'number',
  boolean: 'boolean',
  text: 'text',
};

/**
 * Infère le type d'une expression et relève les références inconnues ou les
 * incohérences de type (ex. `has lanterne + 2`).
 */
export function checkExpr(
  expr: Expr,
  env: TypeEnvironment,
): { type: ExprType; issues: TypeIssue[] } {
  const issues: TypeIssue[] = [];

  const expect = (actual: ExprType, expected: ExprType) => {
    if (actual !== 'unknown' && actual !== expected) {
      issues.push({ code: 'type_mismatch', expected, found: actual });
    }
  };

  const visit = (node: Expr): ExprType => {
    switch (node.t) {
      case 'num':
        return 'number';
      case 'str':
        return 'text';
      case 'bool':
        return 'boolean';
      case 'var': {
        const type = env.varType(node.id);
        if (!type) {
          issues.push({ code: 'unknown_var', ref: node.id });
          return 'unknown';
        }
        return FROM_VARIABLE[type];
      }
      case 'has':
      case 'count':
        if (!env.hasItem(node.item)) issues.push({ code: 'unknown_item', ref: node.item });
        return node.t === 'has' ? 'boolean' : 'number';
      case 'visited':
      case 'visits':
        if (!env.hasPassage(node.passage)) {
          issues.push({ code: 'unknown_passage', ref: node.passage });
        }
        return node.t === 'visited' ? 'boolean' : 'number';
      case 'unlocked':
        if (!env.hasAchievement(node.achievement)) {
          issues.push({ code: 'unknown_achievement', ref: node.achievement });
        }
        return 'boolean';
      case 'not':
        visit(node.e);
        return 'boolean';
      case 'neg':
        expect(visit(node.e), 'number');
        return 'number';
      case 'call':
        for (const arg of node.args) expect(visit(arg), 'number');
        return 'number';
      case 'bin': {
        const left = visit(node.l);
        const right = visit(node.r);
        switch (node.op) {
          case 'and':
          case 'or':
            return 'boolean';
          case '==':
          case '!=':
            if (left !== 'unknown' && right !== 'unknown' && left !== right) {
              issues.push({ code: 'type_mismatch', expected: left, found: right });
            }
            return 'boolean';
          case '<':
          case '<=':
          case '>':
          case '>=':
            expect(left, 'number');
            expect(right, 'number');
            return 'boolean';
          case '+':
            if (left === 'text' || right === 'text') return 'text';
            expect(left, 'number');
            expect(right, 'number');
            return 'number';
          default:
            expect(left, 'number');
            expect(right, 'number');
            return 'number';
        }
      }
    }
  };

  return { type: visit(expr), issues };
}
