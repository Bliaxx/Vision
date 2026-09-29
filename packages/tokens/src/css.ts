import {
  type ColorScheme,
  endingColors,
  genreColors,
  palette,
  readerThemes,
  type SemanticColors,
  semantic,
} from './colors';
import { radii, readingMeasure, shadows } from './layout';
import { durations, easings } from './motion';
import { fallbacks, fontFamilies } from './typography';

const kebab = (value: string) => value.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);

function declarations(entries: Record<string, string | number>, indent = '  '): string {
  return Object.entries(entries)
    .map(([name, value]) => `${indent}--dd-${name}: ${value};`)
    .join('\n');
}

function schemeVariables(scheme: ColorScheme): Record<string, string> {
  const colors: SemanticColors = semantic[scheme];
  const vars: Record<string, string> = {};
  for (const [name, value] of Object.entries(colors)) vars[kebab(name)] = value;
  for (const [name, value] of Object.entries(shadows[scheme])) vars[`shadow-${name}`] = value;
  return vars;
}

function staticVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [scale, shades] of Object.entries(palette)) {
    for (const [shade, value] of Object.entries(shades)) vars[`${scale}-${shade}`] = value;
  }
  for (const [kind, value] of Object.entries(endingColors)) vars[`ending-${kind}`] = value;
  for (const [genre, value] of Object.entries(genreColors)) vars[`genre-${genre}`] = value;
  for (const [role, family] of Object.entries(fontFamilies)) {
    const fallback = fallbacks[role as keyof typeof fallbacks];
    vars[`font-${role}`] = `var(--font-${role}, '${family}'), ${fallback}`;
  }
  for (const [name, value] of Object.entries(radii)) vars[`radius-${name}`] = `${value}px`;
  for (const [name, value] of Object.entries(durations)) vars[`duration-${name}`] = `${value}ms`;
  for (const [name, value] of Object.entries(easings)) vars[`ease-${name}`] = value;
  vars['reading-measure'] = readingMeasure;
  return vars;
}

/**
 * Génère la feuille de variables CSS de la marque : thème clair par défaut,
 * thème sombre via `data-theme="dark"` ou la préférence système, et thèmes de
 * lecture via `data-reader-theme`.
 */
export function buildTokensCss(): string {
  const readerBlocks = Object.entries(readerThemes)
    .map(([name, theme]) => {
      const vars: Record<string, string> = {};
      for (const [key, value] of Object.entries(theme)) vars[`reader-${kebab(key)}`] = value;
      return `[data-reader-theme='${name}'] {\n${declarations(vars)}\n}`;
    })
    .join('\n\n');

  return `/* Généré par @dedale/tokens — ne pas modifier à la main. */
:root {
  color-scheme: light;
${declarations(staticVariables())}
${declarations(schemeVariables('light'))}
${declarations(Object.fromEntries(Object.entries(readerThemes.paper).map(([k, v]) => [`reader-${kebab(k)}`, v])))}
}

:root[data-theme='dark'] {
  color-scheme: dark;
${declarations(schemeVariables('dark'))}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    color-scheme: dark;
${declarations(schemeVariables('dark'), '    ')}
  }
}

${readerBlocks}
`;
}
