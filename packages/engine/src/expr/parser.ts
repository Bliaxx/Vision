import { type BinaryOperator, type Expr, FUNCTION_ARITY, type FunctionName } from './ast';

export type ExprErrorCode =
  | 'unexpected_char'
  | 'unterminated_string'
  | 'unexpected_token'
  | 'unexpected_end'
  | 'expected_identifier'
  | 'expected_passage'
  | 'unknown_function'
  | 'wrong_arity';

export interface ExprError {
  code: ExprErrorCode;
  message: string;
  /** Position (index de caractère) dans la source. */
  at: number;
}

export class ExprSyntaxError extends Error {
  readonly detail: ExprError;
  constructor(detail: ExprError) {
    super(`${detail.message} (position ${detail.at})`);
    this.name = 'ExprSyntaxError';
    this.detail = detail;
  }
}

type TokenType = 'num' | 'str' | 'ident' | 'op' | 'lparen' | 'rparen' | 'comma' | 'eof';

interface Token {
  type: TokenType;
  value: string;
  at: number;
}

const OPERATORS = ['==', '!=', '<=', '>=', '&&', '||', '<', '>', '=', '+', '-', '*', '/', '%', '!'];
const IDENT_START = /[A-Za-z_À-ÖØ-öø-ÿ]/;
const IDENT_PART = /[A-Za-z0-9_À-ÖØ-öø-ÿ]/;
const PASSAGE_PART = /[A-Za-z0-9_-]/;

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source.charAt(i);
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(source.charAt(i + 1)))) {
      const start = i;
      while (i < source.length && /[0-9.]/.test(source.charAt(i))) i++;
      tokens.push({ type: 'num', value: source.slice(start, i), at: start });
      continue;
    }
    if (ch === '"' || ch === "'") {
      const start = i;
      i++;
      let value = '';
      while (i < source.length && source.charAt(i) !== ch) {
        if (source.charAt(i) === '\\' && i + 1 < source.length) i++;
        value += source.charAt(i);
        i++;
      }
      if (i >= source.length) {
        throw new ExprSyntaxError({
          code: 'unterminated_string',
          message: 'chaîne non terminée',
          at: start,
        });
      }
      i++;
      tokens.push({ type: 'str', value, at: start });
      continue;
    }
    if (IDENT_START.test(ch)) {
      const start = i;
      while (i < source.length && IDENT_PART.test(source.charAt(i))) i++;
      tokens.push({ type: 'ident', value: source.slice(start, i), at: start });
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'lparen', value: ch, at: i++ });
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ch, at: i++ });
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ch, at: i++ });
      continue;
    }
    const op = OPERATORS.find((candidate) => source.startsWith(candidate, i));
    if (op) {
      tokens.push({ type: 'op', value: op, at: i });
      i += op.length;
      continue;
    }
    throw new ExprSyntaxError({
      code: 'unexpected_char',
      message: `caractère inattendu « ${ch} »`,
      at: i,
    });
  }
  tokens.push({ type: 'eof', value: '', at: source.length });
  return tokens;
}

/** Mots réservés du langage : interdits comme identifiants de symbole. */
export const RESERVED_WORDS: ReadonlySet<string> = new Set([
  'and',
  'or',
  'not',
  'true',
  'false',
  'has',
  'visited',
  'visits',
  'count',
  'unlocked',
]);
const KEYWORDS = RESERVED_WORDS;

const COMPARISON: Readonly<Record<string, BinaryOperator>> = {
  '==': '==',
  '=': '==',
  '!=': '!=',
  '<': '<',
  '<=': '<=',
  '>': '>',
  '>=': '>=',
};

/**
 * Analyseur à descente récursive. Les identifiants de passage (qui peuvent
 * contenir des tirets) sont lus directement dans la source après `visited`.
 */
class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(private readonly source: string) {
    this.tokens = tokenize(source);
  }

  parse(): Expr {
    const expr = this.parseOr();
    const token = this.peek();
    if (token.type !== 'eof') throw this.unexpected(token);
    return expr;
  }

  private peek(): Token {
    return this.tokens[this.pos] as Token;
  }

  private next(): Token {
    const token = this.peek();
    if (token.type !== 'eof') this.pos++;
    return token;
  }

  private isKeyword(token: Token, keyword: string): boolean {
    return token.type === 'ident' && token.value.toLowerCase() === keyword;
  }

  private isOp(token: Token, ...ops: string[]): boolean {
    return token.type === 'op' && ops.includes(token.value);
  }

  private unexpected(token: Token): ExprSyntaxError {
    if (token.type === 'eof') {
      return new ExprSyntaxError({
        code: 'unexpected_end',
        message: 'expression incomplète',
        at: token.at,
      });
    }
    return new ExprSyntaxError({
      code: 'unexpected_token',
      message: `élément inattendu « ${token.value} »`,
      at: token.at,
    });
  }

  private expect(type: TokenType): Token {
    const token = this.next();
    if (token.type !== type) throw this.unexpected(token);
    return token;
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.isKeyword(this.peek(), 'or') || this.isOp(this.peek(), '||')) {
      this.next();
      left = { t: 'bin', op: 'or', l: left, r: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseNot();
    while (this.isKeyword(this.peek(), 'and') || this.isOp(this.peek(), '&&')) {
      this.next();
      left = { t: 'bin', op: 'and', l: left, r: this.parseNot() };
    }
    return left;
  }

  private parseNot(): Expr {
    if (this.isKeyword(this.peek(), 'not') || this.isOp(this.peek(), '!')) {
      this.next();
      return { t: 'not', e: this.parseNot() };
    }
    return this.parseComparison();
  }

  private parseComparison(): Expr {
    const left = this.parseSum();
    const token = this.peek();
    if (token.type === 'op' && token.value in COMPARISON) {
      this.next();
      const op = COMPARISON[token.value] as BinaryOperator;
      return { t: 'bin', op, l: left, r: this.parseSum() };
    }
    return left;
  }

  private parseSum(): Expr {
    let left = this.parseProduct();
    while (this.isOp(this.peek(), '+', '-')) {
      const op = this.next().value as '+' | '-';
      left = { t: 'bin', op, l: left, r: this.parseProduct() };
    }
    return left;
  }

  private parseProduct(): Expr {
    let left = this.parseUnary();
    while (this.isOp(this.peek(), '*', '/', '%')) {
      const op = this.next().value as '*' | '/' | '%';
      left = { t: 'bin', op, l: left, r: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.isOp(this.peek(), '-')) {
      this.next();
      const operand = this.parseUnary();
      if (operand.t === 'num') return { t: 'num', v: -operand.v };
      return { t: 'neg', e: operand };
    }
    return this.parsePrimary();
  }

  private parseSymbol(): string {
    const token = this.next();
    if (token.type !== 'ident' || KEYWORDS.has(token.value.toLowerCase())) {
      throw new ExprSyntaxError({
        code: 'expected_identifier',
        message: 'identifiant attendu',
        at: token.at,
      });
    }
    return token.value;
  }

  /**
   * Lit un identifiant de passage directement dans la source : ceux-ci peuvent
   * contenir des tirets (`la-crypte`), ce que le lexeur ne sait pas distinguer
   * d'une soustraction.
   */
  private parsePassageId(): string {
    const token = this.peek();
    if (token.type !== 'ident') {
      throw new ExprSyntaxError({
        code: 'expected_passage',
        message: 'identifiant de passage attendu',
        at: token.at,
      });
    }
    let end = token.at;
    while (end < this.source.length && PASSAGE_PART.test(this.source.charAt(end))) end++;
    const id = this.source.slice(token.at, end);
    while (this.peek().type !== 'eof' && this.peek().at < end) this.pos++;
    return id;
  }

  private parsePrimary(): Expr {
    const token = this.peek();
    switch (token.type) {
      case 'num': {
        this.next();
        const value = Number(token.value);
        if (!Number.isFinite(value)) throw this.unexpected(token);
        return { t: 'num', v: value };
      }
      case 'str':
        this.next();
        return { t: 'str', v: token.value };
      case 'lparen': {
        this.next();
        const inner = this.parseOr();
        this.expect('rparen');
        return inner;
      }
      case 'ident':
        return this.parseIdentifier(token);
      default:
        throw this.unexpected(token);
    }
  }

  private parseIdentifier(token: Token): Expr {
    const keyword = token.value.toLowerCase();
    switch (keyword) {
      case 'true':
      case 'false':
        this.next();
        return { t: 'bool', v: keyword === 'true' };
      case 'has': {
        this.next();
        const item = this.parseSymbol();
        let qty = 1;
        const maybeQty = this.peek();
        if (maybeQty.type === 'num') {
          this.next();
          qty = Math.max(1, Math.floor(Number(maybeQty.value)));
        }
        return { t: 'has', item, qty };
      }
      case 'visited':
        this.next();
        return { t: 'visited', passage: this.parsePassageId() };
      case 'visits': {
        this.next();
        this.expect('lparen');
        const passage = this.parsePassageId();
        this.expect('rparen');
        return { t: 'visits', passage };
      }
      case 'count': {
        this.next();
        this.expect('lparen');
        const item = this.parseSymbol();
        this.expect('rparen');
        return { t: 'count', item };
      }
      case 'unlocked':
        this.next();
        return { t: 'unlocked', achievement: this.parseSymbol() };
      default:
        break;
    }
    if (KEYWORDS.has(keyword)) throw this.unexpected(token);
    this.next();
    if (this.peek().type === 'lparen') return this.parseCall(token);
    return { t: 'var', id: token.value };
  }

  private parseCall(name: Token): Expr {
    const fn = name.value.toLowerCase();
    if (!(fn in FUNCTION_ARITY)) {
      throw new ExprSyntaxError({
        code: 'unknown_function',
        message: `fonction inconnue « ${name.value} »`,
        at: name.at,
      });
    }
    this.expect('lparen');
    const args: Expr[] = [];
    if (this.peek().type !== 'rparen') {
      args.push(this.parseOr());
      while (this.peek().type === 'comma') {
        this.next();
        args.push(this.parseOr());
      }
    }
    this.expect('rparen');
    const arity = FUNCTION_ARITY[fn as FunctionName];
    if (args.length !== arity) {
      throw new ExprSyntaxError({
        code: 'wrong_arity',
        message: `${fn} attend ${arity} argument(s)`,
        at: name.at,
      });
    }
    return { t: 'call', fn: fn as FunctionName, args };
  }
}

/** Analyse une expression ; lève `ExprSyntaxError` en cas d'erreur. */
export function parseExpr(source: string): Expr {
  return new Parser(source).parse();
}

export type TryParseResult = { ok: true; expr: Expr } | { ok: false; error: ExprError };

/** Variante sans exception, adaptée aux éditeurs et à l'analyse statique. */
export function tryParseExpr(source: string): TryParseResult {
  try {
    return { ok: true, expr: parseExpr(source) };
  } catch (error) {
    if (error instanceof ExprSyntaxError) return { ok: false, error: error.detail };
    throw error;
  }
}
