/**
 * Mouvement : sobre et signifiant. Le « tracé du fil » (1,2 s) est réservé
 * aux moments narratifs (choix validé, fin atteinte). Tout respecte
 * `prefers-reduced-motion`.
 */
export const durations = {
  instant: 80,
  fast: 140,
  base: 220,
  slow: 420,
  thread: 1200,
} as const;

export const easings = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  thread: 'cubic-bezier(0.22, 1, 0.36, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

/** Équivalents pour React Native Reanimated (courbes de Bézier). */
export const bezier = {
  standard: [0.2, 0, 0, 1],
  thread: [0.22, 1, 0.36, 1],
  exit: [0.4, 0, 1, 1],
} as const;
