/** Éléments de marque (textes invariants, métadonnées). */
export const brand = {
  name: 'Dédale',
  asciiName: 'Dedale',
  domain: 'dedale.app',
  tagline: {
    fr: 'Des histoires dont vous tenez le fil.',
    en: 'Stories where you hold the thread.',
  },
  themeColor: { light: '#F6F1E7', dark: '#0F0E1C' },
} as const;

/**
 * Monogramme : un « D » en forme de labyrinthe, parcouru par le fil rouge
 * jusqu'à son cœur. Tracés dessinés sur une grille de 64 × 64.
 */
export const monogram = {
  viewBox: '0 0 64 64',
  walls: [
    'M12 20 V54 H30 A22 22 0 0 0 30 10 H22',
    'M20 38 V18 H30 A14 14 0 0 1 30 46 H26',
    'M28 26 V38 H30 A6 6 0 0 0 35.2 29',
  ],
  thread: 'M4 4 L16 16 V42 H25 A10 10 0 0 0 36.4 24.3 L30 32',
  knot: { cx: 30, cy: 32, r: 3.2 },
} as const;
