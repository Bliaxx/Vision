import { describe, expect, it } from 'vitest';
import type { ExprScope } from '../src';
import { blocksToPlainText, parseInlines, parseTemplate, resolveTemplate, toBlocks } from '../src';

const scope: ExprScope = {
  vars: { nom: 'Élise', ecus: 1234.5, piege: '*danger*' },
  inventory: { lanterne: 1 },
  visits: {},
  achievements: [],
};

const render = (source: string) => toBlocks(resolveTemplate(parseTemplate(source).nodes, scope));

describe('gabarits', () => {
  it('interpole et formate selon la langue', () => {
    expect(resolveTemplate(parseTemplate('Or : {{ecus}}').nodes, scope, 'fr')).toBe('Or : 1 234,5');
    expect(resolveTemplate(parseTemplate('Gold: {{ ecus }}').nodes, scope, 'en')).toBe(
      'Gold: 1,234.5',
    );
  });

  it('résout les conditions imbriquées et else if', () => {
    const source =
      '{{#if has lanterne}}Lumière{{#if nom == "Élise"}} pour Élise{{/if}}{{else if ecus > 1}}Or{{else}}Nuit{{/if}}.';
    expect(resolveTemplate(parseTemplate(source).nodes, scope)).toBe('Lumière pour Élise.');
    const dark = { ...scope, inventory: {} };
    expect(resolveTemplate(parseTemplate(source).nodes, dark)).toBe('Or.');
    expect(resolveTemplate(parseTemplate(source).nodes, { ...dark, vars: {} })).toBe('Nuit.');
  });

  it('échappe les valeurs interpolées (pas d’injection de balisage)', () => {
    const blocks = render('Attention : {{piege}}');
    expect(blocks).toEqual([
      {
        type: 'paragraph',
        inlines: [{ type: 'text', text: 'Attention : *danger*', bold: false, italic: false }],
      },
    ]);
  });

  it('signale les erreurs de balisage sans échouer', () => {
    const cases: [string, string][] = [
      ['{{#if courage >}}x{{/if}}', 'invalid_expression'],
      ['{{#if a}}x', 'unclosed_if'],
      ['x{{/if}}', 'unexpected_endif'],
      ['{{else}}', 'unexpected_else'],
      ['{{}}', 'empty_tag'],
      ['texte {{ nom', 'unclosed_tag'],
      ['{{ 1 + }}', 'invalid_expression'],
    ];
    for (const [source, code] of cases) {
      expect(
        parseTemplate(source).errors.map((error) => error.code),
        source,
      ).toContain(code);
    }
  });

  it('peut couvrir plusieurs paragraphes', () => {
    const blocks = render('Avant\n\n{{#if has lanterne}}Un\n\nDeux{{/if}}\n\nAprès');
    expect(blocks.map((block) => block.type)).toEqual([
      'paragraph',
      'paragraph',
      'paragraph',
      'paragraph',
    ]);
  });
});

describe('blocs et mise en forme', () => {
  it('reconnaît titres, citations, séparateurs et sauts de ligne', () => {
    const blocks = toBlocks(
      '# Chapitre I\n\n> Une pensée\n> sur deux lignes\n\n---\n\nLigne 1\nLigne 2',
    );
    expect(blocks.map((block) => block.type)).toEqual([
      'heading',
      'quote',
      'separator',
      'paragraph',
    ]);
    expect(blocksToPlainText(blocks)).toBe(
      'Chapitre I\n\nUne pensée\nsur deux lignes\n\n—\n\nLigne 1\nLigne 2',
    );
  });

  it('gère gras, italique et échappements', () => {
    expect(parseInlines('Un **grand** *vent* \\*libre\\*')).toEqual([
      { type: 'text', text: 'Un ', bold: false, italic: false },
      { type: 'text', text: 'grand', bold: true, italic: false },
      { type: 'text', text: ' ', bold: false, italic: false },
      { type: 'text', text: 'vent', bold: false, italic: true },
      { type: 'text', text: ' *libre*', bold: false, italic: false },
    ]);
    expect(parseInlines('***fort et penché***')[0]).toEqual({
      type: 'text',
      text: 'fort et penché',
      bold: true,
      italic: true,
    });
  });

  it('ignore les blocs vides et normalise les fins de ligne', () => {
    expect(toBlocks('\r\n\r\nA\r\n\r\n\r\n   \r\nB\n')).toHaveLength(2);
  });
});
