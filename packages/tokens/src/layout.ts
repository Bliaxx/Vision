/** Grille de 4 px. */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Ombres chaudes, comme une page posée sur un bureau. */
export const shadows = {
  light: {
    sm: '0 1px 2px rgba(27, 26, 46, 0.06), 0 1px 1px rgba(27, 26, 46, 0.04)',
    md: '0 1px 0 rgba(27, 26, 46, 0.04), 0 8px 24px -12px rgba(27, 26, 46, 0.28)',
    lg: '0 2px 0 rgba(27, 26, 46, 0.04), 0 24px 48px -20px rgba(27, 26, 46, 0.35)',
    glow: '0 0 0 1px rgba(217, 59, 37, 0.25), 0 8px 30px -8px rgba(217, 59, 37, 0.45)',
  },
  dark: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
    md: '0 1px 0 rgba(255, 255, 255, 0.03), 0 12px 32px -12px rgba(0, 0, 0, 0.7)',
    lg: '0 2px 0 rgba(255, 255, 255, 0.03), 0 30px 60px -20px rgba(0, 0, 0, 0.8)',
    glow: '0 0 0 1px rgba(255, 106, 77, 0.3), 0 8px 32px -6px rgba(255, 106, 77, 0.45)',
  },
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/** Largeur de colonne de lecture confortable (≈ 66 caractères). */
export const readingMeasure = '38rem';
