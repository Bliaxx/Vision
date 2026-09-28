import { type ExprScope, evaluate, evaluateCondition, formatValue } from '../expr/evaluate';
import type { TemplateNode } from './template';

/**
 * Balisage de Dédale — seconde passe : blocs et mise en forme.
 *
 *   Paragraphes séparés par une ligne vide
 *   > citation / pensée intérieure
 *   # Titre de scène
 *   ---                (changement de scène)
 *   **gras**, *italique*, \* (échappement)
 *
 * Le résultat est une structure neutre (ni HTML ni composants natifs) que le
 * web et le mobile rendent chacun avec leurs primitives.
 */
export type Inline =
  | {
      readonly type: 'text';
      readonly text: string;
      readonly bold: boolean;
      readonly italic: boolean;
    }
  | { readonly type: 'break' };

export type Block =
  | { readonly type: 'paragraph'; readonly inlines: readonly Inline[] }
  | { readonly type: 'quote'; readonly inlines: readonly Inline[] }
  | { readonly type: 'heading'; readonly inlines: readonly Inline[] }
  | { readonly type: 'separator' };

const ESCAPABLE = /[\\*_>#-]/g;

function escapeMarkup(text: string): string {
  return text.replace(ESCAPABLE, (ch) => `\\${ch}`);
}

/** Résout conditions et interpolations ; les valeurs interpolées sont échappées. */
export function resolveTemplate(
  nodes: readonly TemplateNode[],
  scope: ExprScope,
  locale = 'fr',
): string {
  let out = '';
  for (const node of nodes) {
    if (node.t === 'text') {
      out += node.v;
    } else if (node.t === 'interp') {
      out += escapeMarkup(formatValue(evaluate(node.expr, scope), locale));
    } else {
      const branch = node.branches.find((candidate) => evaluateCondition(candidate.cond, scope));
      out += resolveTemplate(branch ? branch.body : node.otherwise, scope, locale);
    }
  }
  return out;
}

/** Découpe un texte mis en forme en segments gras / italique. */
export function parseInlines(text: string): Inline[] {
  const inlines: Inline[] = [];
  let bold = false;
  let italic = false;
  let buffer = '';

  const flush = () => {
    if (buffer) inlines.push({ type: 'text', text: buffer, bold, italic });
    buffer = '';
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (ch === '\\' && i + 1 < text.length) {
      buffer += text.charAt(i + 1);
      i++;
    } else if (ch === '\n') {
      flush();
      inlines.push({ type: 'break' });
    } else if (ch === '*' && text.charAt(i + 1) === '*') {
      flush();
      bold = !bold;
      i++;
    } else if (ch === '*') {
      flush();
      italic = !italic;
    } else {
      buffer += ch;
    }
  }
  flush();
  return inlines;
}

function toBlock(chunk: string): Block | null {
  const joined = chunk
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
  if (!joined) return null;
  if (/^(-{3,}|\*{3,})$/.test(joined)) return { type: 'separator' };
  const lines = joined.split('\n');
  if (lines.every((line) => /^\s*>/.test(line))) {
    const text = lines.map((line) => line.replace(/^\s*>\s?/, '')).join('\n');
    return { type: 'quote', inlines: parseInlines(text) };
  }
  if (lines.length === 1 && /^#{1,3}\s/.test(joined)) {
    return { type: 'heading', inlines: parseInlines(joined.replace(/^#{1,3}\s+/, '')) };
  }
  return { type: 'paragraph', inlines: parseInlines(joined) };
}

export function toBlocks(text: string): Block[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n/)
    .map(toBlock)
    .filter((block): block is Block => block !== null);
}

/** Texte brut (synthèse vocale, extraits, recherche). */
export function blocksToPlainText(blocks: readonly Block[]): string {
  return blocks
    .map((block) =>
      block.type === 'separator'
        ? '—'
        : block.inlines.map((inline) => (inline.type === 'break' ? '\n' : inline.text)).join(''),
    )
    .join('\n\n');
}

/** Rendu d'un libellé court (texte de choix) : une seule ligne, sans blocs. */
export function renderInline(
  nodes: readonly TemplateNode[],
  scope: ExprScope,
  locale = 'fr',
): Inline[] {
  return parseInlines(
    resolveTemplate(nodes, scope, locale)
      .replace(/\s*\n\s*/g, ' ')
      .trim(),
  );
}
