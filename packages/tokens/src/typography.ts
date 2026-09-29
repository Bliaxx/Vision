/**
 * Typographies :
 * - Fraunces (titrage) : un serif « doux et bizarre », littéraire et joueur.
 * - Literata (lecture) : dessinée pour la lecture longue sur écran.
 * - Manrope (interface) : géométrique, chaleureuse, très lisible en petit.
 * - Atkinson Hyperlegible Next et Lexend : options d'accessibilité en lecture.
 * - JetBrains Mono : conditions et expressions dans l'éditeur.
 */
export const fontFamilies = {
  display: 'Fraunces',
  reading: 'Literata',
  ui: 'Manrope',
  accessible: 'Atkinson Hyperlegible Next',
  dyslexia: 'Lexend',
  mono: 'JetBrains Mono',
} as const;

export type ReadingFont = 'reading' | 'accessible' | 'dyslexia';

export const fallbacks = {
  display: 'ui-serif, Georgia, "Times New Roman", serif',
  reading: 'ui-serif, Georgia, "Times New Roman", serif',
  ui: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  accessible: 'ui-sans-serif, system-ui, sans-serif',
  dyslexia: 'ui-sans-serif, system-ui, sans-serif',
  mono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
} as const;

/** Échelle modulaire (rapport 1,25) en pixels. */
export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 38,
  '5xl': 48,
  '6xl': 60,
  '7xl': 76,
} as const;

export const lineHeights = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  reading: 1.7,
} as const;

export const letterSpacings = {
  tight: '-0.02em',
  normal: '0',
  wide: '0.04em',
  caps: '0.12em',
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 800,
} as const;

/** Tailles de texte proposées au lecteur (préférences d'accessibilité). */
export const readingSizes = [16, 18, 20, 22, 24, 28] as const;
