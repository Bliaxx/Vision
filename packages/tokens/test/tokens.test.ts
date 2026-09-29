import { describe, expect, it } from 'vitest';
import { buildTokensCss, readerThemes, semantic } from '../src';
import { nativeTheme } from '../src/native';

/** Luminance relative WCAG 2.1. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

describe('accessibilité des couleurs (WCAG 2.1 AA)', () => {
  it.each(['light', 'dark'] as const)('thème %s : textes lisibles', (scheme) => {
    const colors = semantic[scheme];
    expect(contrast(colors.text, colors.background)).toBeGreaterThanOrEqual(7);
    expect(contrast(colors.textMuted, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.textMuted, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.onAccent, colors.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.accent, colors.background)).toBeGreaterThanOrEqual(3);
  });

  it.each(Object.keys(readerThemes) as (keyof typeof readerThemes)[])(
    'thème de lecture %s : texte AAA',
    (name) => {
      const theme = readerThemes[name];
      expect(contrast(theme.text, theme.page)).toBeGreaterThanOrEqual(7);
      expect(contrast(theme.muted, theme.page)).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe('exports', () => {
  it('génère les variables CSS des deux thèmes', () => {
    const css = buildTokensCss();
    expect(css).toContain('--dd-background: #F6F1E7;');
    expect(css).toContain(":root[data-theme='dark']");
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain("[data-reader-theme='sepia']");
    expect(css).toContain("--dd-font-reading: var(--font-reading, 'Literata')");
  });

  it('fournit un thème natif', () => {
    expect(nativeTheme('dark').colors.background).toBe(semantic.dark.background);
  });
});
