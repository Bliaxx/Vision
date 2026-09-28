import { describe, expect, it } from 'vitest';
import type { ExprScope, TypeEnvironment, VariableType } from '../src';
import {
  checkExpr,
  collectReferences,
  ExprSyntaxError,
  evaluate,
  evaluateCondition,
  parseExpr,
  printExpr,
  tryParseExpr,
} from '../src';

const scope: ExprScope = {
  vars: { courage: 3, ecus: 10, nom: 'Élise', ami: true },
  inventory: { lanterne: 1, piece: 5 },
  visits: { crypte: 2 },
  achievements: ['brave'],
};

const evalSource = (source: string) => evaluate(parseExpr(source), scope);

describe('parseExpr', () => {
  it('respecte la priorité des opérateurs', () => {
    expect(evalSource('1 + 2 * 3')).toBe(7);
    expect(evalSource('(1 + 2) * 3')).toBe(9);
    expect(evalSource('10 - 4 - 3')).toBe(3);
    expect(evalSource('-2 * -3')).toBe(6);
  });

  it('gère la logique booléenne et ses alias', () => {
    expect(evalSource('courage >= 3 and has lanterne')).toBe(true);
    expect(evalSource('courage > 3 || has lanterne')).toBe(true);
    expect(evalSource('not has cle && !false')).toBe(true);
    expect(evalSource('courage = 3')).toBe(true);
  });

  it('comprend les prédicats narratifs', () => {
    expect(evalSource('has piece 5')).toBe(true);
    expect(evalSource('has piece 6')).toBe(false);
    expect(evalSource('count(piece) * 2')).toBe(10);
    expect(evalSource('visited crypte')).toBe(true);
    expect(evalSource('visits(crypte) + 1')).toBe(3);
    expect(evalSource('unlocked brave and not unlocked lache')).toBe(true);
  });

  it('lit les identifiants de passage avec tirets après visited', () => {
    expect(parseExpr('visited la-crypte-noire and courage > 1')).toEqual({
      t: 'bin',
      op: 'and',
      l: { t: 'visited', passage: 'la-crypte-noire' },
      r: { t: 'bin', op: '>', l: { t: 'var', id: 'courage' }, r: { t: 'num', v: 1 } },
    });
  });

  it('supporte chaînes et fonctions', () => {
    expect(evalSource('nom == "Élise"')).toBe(true);
    expect(evalSource("'Bonjour ' + nom")).toBe('Bonjour Élise');
    expect(evalSource('max(courage - 5, 0) + min(1, 2) + abs(-3)')).toBe(4);
    expect(evalSource('round(7 / 2) + floor(1.9) + ceil(0.1)')).toBe(6);
  });

  it('est total à l’évaluation', () => {
    expect(evalSource('ecus / 0')).toBe(0);
    expect(evalSource('ecus % 0')).toBe(0);
    expect(evalSource('inconnue + 1')).toBe(1);
  });

  it('signale précisément les erreurs de syntaxe', () => {
    const cases: [string, string][] = [
      ['courage >=', 'unexpected_end'],
      ['courage @ 2', 'unexpected_char'],
      ['"non terminée', 'unterminated_string'],
      ['has 3', 'expected_identifier'],
      ['visited 3', 'expected_passage'],
      ['racine(4)', 'unknown_function'],
      ['min(1)', 'wrong_arity'],
      ['(1 + 2', 'unexpected_end'],
      ['1 2', 'unexpected_token'],
    ];
    for (const [source, code] of cases) {
      const result = tryParseExpr(source);
      expect(result.ok, source).toBe(false);
      if (!result.ok) expect(result.error.code, source).toBe(code);
    }
    expect(() => parseExpr('and')).toThrow(ExprSyntaxError);
  });
});

describe('printExpr', () => {
  const sources = [
    'courage >= 3 and has lanterne',
    '(a or b) and not c',
    'a - (b - c)',
    'a - b - c',
    '(a + b) * c',
    'not (a and b)',
    'has piece 3 or visited la-crypte',
    'max(a, b) / 2',
    '-(a + b)',
    'nom == "Il a dit \\"non\\""',
    'visits(debut) > 1 and unlocked brave',
    'count(piece) % 2 == 0',
    '1.5 * x',
  ];
  it.each(sources)('fait un aller-retour sans perte : %s', (source) => {
    const expr = parseExpr(source);
    expect(parseExpr(printExpr(expr))).toEqual(expr);
  });

  it('produit une forme canonique minimale', () => {
    expect(printExpr(parseExpr('((a)) && (b || c)'))).toBe('a and (b or c)');
    expect(printExpr(parseExpr('true || FALSE'))).toBe('true or false');
  });
});

describe('checkExpr', () => {
  const types: Record<string, VariableType> = { courage: 'number', nom: 'text', ami: 'boolean' };
  const env: TypeEnvironment = {
    varType: (id) => types[id],
    hasItem: (id) => id === 'lanterne',
    hasPassage: (id) => id === 'crypte',
    hasAchievement: (id) => id === 'brave',
  };

  it('infère les types', () => {
    expect(checkExpr(parseExpr('courage + 1'), env).type).toBe('number');
    expect(checkExpr(parseExpr('nom + "!"'), env).type).toBe('text');
    expect(checkExpr(parseExpr('courage > 1 and ami'), env).type).toBe('boolean');
  });

  it('relève références inconnues et incohérences', () => {
    const { issues } = checkExpr(
      parseExpr('has epee or visited nulle-part or unlocked lache or force > 1 or courage > ami'),
      env,
    );
    expect(issues.map((issue) => issue.code)).toEqual([
      'unknown_item',
      'unknown_passage',
      'unknown_achievement',
      'unknown_var',
      'type_mismatch',
    ]);
    expect(checkExpr(parseExpr('nom == 3'), env).issues[0]?.code).toBe('type_mismatch');
    expect(checkExpr(parseExpr('-ami'), env).issues[0]?.code).toBe('type_mismatch');
  });

  it('collecte les références', () => {
    const refs = collectReferences(
      parseExpr('has a and courage > count(b) or visited p or unlocked z'),
    );
    expect([...refs.items]).toEqual(['a', 'b']);
    expect([...refs.vars]).toEqual(['courage']);
    expect([...refs.passages]).toEqual(['p']);
    expect([...refs.achievements]).toEqual(['z']);
  });

  it('évalue les conditions en booléen', () => {
    expect(evaluateCondition(parseExpr('count(piece)'), scope)).toBe(true);
    expect(evaluateCondition(parseExpr('nom'), scope)).toBe(true);
    expect(evaluateCondition(parseExpr('0'), scope)).toBe(false);
  });
});
