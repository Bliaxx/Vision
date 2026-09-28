import type { Expr } from '../expr/ast';
import { tryParseExpr } from '../expr/parser';

/**
 * Balisage de Dédale — première passe : gabarit.
 *
 *   {{ or }}                          → interpolation d'une expression
 *   {{#if has lanterne}} … {{/if}}    → texte conditionnel
 *   {{else if courage > 2}} / {{else}}
 *
 * Les conditions peuvent englober plusieurs paragraphes : elles sont résolues
 * avant le découpage en blocs (voir `render.ts`).
 */
export type TemplateNode =
  | { readonly t: 'text'; readonly v: string }
  | { readonly t: 'interp'; readonly expr: Expr; readonly source: string }
  | {
      readonly t: 'if';
      readonly branches: readonly TemplateBranch[];
      readonly otherwise: readonly TemplateNode[];
    };

export interface TemplateBranch {
  readonly cond: Expr;
  readonly source: string;
  readonly body: readonly TemplateNode[];
}

export type MarkupErrorCode =
  | 'unclosed_tag'
  | 'unclosed_if'
  | 'unexpected_else'
  | 'unexpected_endif'
  | 'invalid_expression'
  | 'empty_tag';

export interface MarkupError {
  code: MarkupErrorCode;
  at: number;
  message: string;
  source?: string;
}

export interface ParsedTemplate {
  nodes: TemplateNode[];
  errors: MarkupError[];
  /** Expressions rencontrées (interpolations et conditions), pour l'analyse. */
  expressions: Expr[];
}

interface Frame {
  branches: { cond: Expr; source: string; body: TemplateNode[] }[];
  otherwise: TemplateNode[] | null;
  at: number;
}

const TAG = /\{\{([\s\S]*?)\}\}/g;

export function parseTemplate(source: string): ParsedTemplate {
  const root: TemplateNode[] = [];
  const stack: Frame[] = [];
  const errors: MarkupError[] = [];
  const expressions: Expr[] = [];

  const target = (): TemplateNode[] => {
    const frame = stack.at(-1);
    if (!frame) return root;
    if (frame.otherwise) return frame.otherwise;
    return (frame.branches.at(-1) as { body: TemplateNode[] }).body;
  };

  const pushText = (text: string) => {
    if (!text) return;
    const nodes = target();
    const last = nodes.at(-1);
    if (last?.t === 'text') nodes[nodes.length - 1] = { t: 'text', v: last.v + text };
    else nodes.push({ t: 'text', v: text });
  };

  const parseCondition = (raw: string, at: number): Expr | null => {
    const result = tryParseExpr(raw);
    if (result.ok) {
      expressions.push(result.expr);
      return result.expr;
    }
    errors.push({
      code: 'invalid_expression',
      at: at + result.error.at,
      message: result.error.message,
      source: raw,
    });
    return null;
  };

  let cursor = 0;
  TAG.lastIndex = 0;
  for (let match = TAG.exec(source); match; match = TAG.exec(source)) {
    pushText(source.slice(cursor, match.index));
    cursor = match.index + match[0].length;
    const inner = (match[1] ?? '').trim();
    const at = match.index;

    if (inner === '') {
      errors.push({ code: 'empty_tag', at, message: 'balise vide' });
      continue;
    }
    if (inner.startsWith('#if ') || inner === '#if') {
      const raw = inner.slice(3).trim();
      const cond = parseCondition(raw, at + 5) ?? { t: 'bool', v: false };
      stack.push({ branches: [{ cond, source: raw, body: [] }], otherwise: null, at });
      continue;
    }
    if (inner.startsWith('else if ')) {
      const frame = stack.at(-1);
      if (!frame || frame.otherwise) {
        errors.push({ code: 'unexpected_else', at, message: '« else » sans « #if » ouvert' });
        continue;
      }
      const raw = inner.slice(8).trim();
      const cond = parseCondition(raw, at + 10) ?? { t: 'bool', v: false };
      frame.branches.push({ cond, source: raw, body: [] });
      continue;
    }
    if (inner === 'else') {
      const frame = stack.at(-1);
      if (!frame || frame.otherwise) {
        errors.push({ code: 'unexpected_else', at, message: '« else » sans « #if » ouvert' });
        continue;
      }
      frame.otherwise = [];
      continue;
    }
    if (inner === '/if') {
      const frame = stack.pop();
      if (!frame) {
        errors.push({ code: 'unexpected_endif', at, message: '« /if » sans « #if » ouvert' });
        continue;
      }
      target().push({ t: 'if', branches: frame.branches, otherwise: frame.otherwise ?? [] });
      continue;
    }
    const result = tryParseExpr(inner);
    if (result.ok) {
      expressions.push(result.expr);
      target().push({ t: 'interp', expr: result.expr, source: inner });
    } else {
      errors.push({
        code: 'invalid_expression',
        at: at + 2 + result.error.at,
        message: result.error.message,
        source: inner,
      });
    }
  }
  const rest = source.slice(cursor);
  const danglingOpen = rest.indexOf('{{');
  if (danglingOpen !== -1) {
    errors.push({
      code: 'unclosed_tag',
      at: cursor + danglingOpen,
      message: 'balise « {{ » non refermée',
    });
  }
  pushText(rest);

  while (stack.length > 0) {
    const frame = stack.pop() as Frame;
    errors.push({ code: 'unclosed_if', at: frame.at, message: '« #if » non refermé par « /if »' });
    target().push({ t: 'if', branches: frame.branches, otherwise: frame.otherwise ?? [] });
  }

  return { nodes: root, errors, expressions };
}

/** Texte brut sans balises (toutes branches confondues), pour compter les mots. */
export function templateToRawText(nodes: readonly TemplateNode[]): string {
  let text = '';
  for (const node of nodes) {
    if (node.t === 'text') text += node.v;
    else if (node.t === 'interp') text += ' ';
    else {
      for (const branch of node.branches) text += ` ${templateToRawText(branch.body)} `;
      text += ` ${templateToRawText(node.otherwise)} `;
    }
  }
  return text;
}
