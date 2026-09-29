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
    'M12 18 V54 H28 A22 22 0 0 0 28 10 H20',
    'M20 26 V46 H28 A14 14 0 0 0 28 18',
    'M28 26 A6 6 0 0 1 28 38 H28',
  ],
  thread: 'M4 4 L16 14 V50 H28 A18 18 0 0 0 28 14 H24 V42 H28 A10 10 0 0 0 28 22 V32',
  knot: { cx: 28, cy: 32, r: 3.2 },
} as const;
