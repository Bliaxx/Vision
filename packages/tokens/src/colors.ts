/**
 * Palette Dédale — « l'encre, le parchemin et le fil rouge ».
 *
 * - Encre : un bleu-noir profond, la nuit du labyrinthe.
 * - Parchemin : un blanc chaud, la page du livre.
 * - Fil : un vermillon vif, le fil d'Ariane qui guide le lecteur. C'est la
 *   couleur signature : elle marque toujours le chemin, le choix, l'action.
 * - Laiton : l'or patiné des succès et de l'offre premium.
 */
export const palette = {
  ink: {
    50: '#F3F2F8',
    100: '#E4E2EF',
    200: '#C7C3DC',
    300: '#A09ABF',
    400: '#78719C',
    500: '#565079',
    600: '#403A5E',
    700: '#2E2A47',
    800: '#1F1D36',
    900: '#17162A',
    950: '#0F0E1C',
  },
  paper: {
    50: '#FFFDF8',
    100: '#FBF8F2',
    200: '#F6F1E7',
    300: '#EFE8DA',
    400: '#E4D9C4',
    500: '#D3C4A6',
    600: '#B6A27E',
  },
  thread: {
    50: '#FFF1EE',
    100: '#FFDCD4',
    200: '#FFB5A6',
    300: '#FF8B74',
    400: '#FF6A4D',
    500: '#EE4A2E',
    600: '#D93B25',
    700: '#B32C1B',
    800: '#8C2417',
    900: '#5E1A11',
  },
  brass: {
    100: '#F6ECD6',
    300: '#E4C98E',
    400: '#D9B26A',
    500: '#C39A4B',
    600: '#A67C2E',
    700: '#7F5E22',
  },
  moss: { 400: '#5FA37E', 500: '#3E7D5C', 700: '#285440' },
  amethyst: { 400: '#9B82E0', 500: '#7A5BC7', 700: '#553B96' },
  amber: { 400: '#F2B84B', 600: '#B7791F' },
  crimson: { 400: '#F97066', 600: '#B42318', 800: '#7A1A12' },
  slate: { 400: '#8B90A0', 600: '#5B6070' },
  sepia: { 500: '#8C7B63' },
} as const;

export type ColorScheme = 'light' | 'dark';

/** Couleurs sémantiques de l'interface, par thème. */
export interface SemanticColors {
  readonly background: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly surfaceSunken: string;
  readonly border: string;
  readonly borderStrong: string;
  readonly text: string;
  readonly textMuted: string;
  readonly textSubtle: string;
  readonly accent: string;
  readonly accentHover: string;
  readonly accentSoft: string;
  readonly onAccent: string;
  readonly brass: string;
  readonly brassSoft: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly info: string;
  readonly focus: string;
  readonly overlay: string;
  /** Fond de la toile de l'éditeur de graphe. */
  readonly canvas: string;
  readonly canvasDot: string;
}

export const semantic: Readonly<Record<ColorScheme, SemanticColors>> = {
  light: {
    background: palette.paper[200],
    surface: palette.paper[50],
    surfaceRaised: '#FFFFFF',
    surfaceSunken: palette.paper[300],
    border: '#DDD3C0',
    borderStrong: '#C2B497',
    text: '#1B1A2E',
    textMuted: '#58546A',
    textSubtle: '#7E7990',
    accent: palette.thread[600],
    accentHover: palette.thread[700],
    accentSoft: palette.thread[50],
    onAccent: '#FFFFFF',
    brass: palette.brass[600],
    brassSoft: palette.brass[100],
    success: palette.moss[500],
    warning: palette.amber[600],
    danger: palette.crimson[600],
    info: '#2F6F73',
    focus: palette.thread[500],
    overlay: 'rgba(15, 14, 28, 0.55)',
    canvas: '#F1EBDF',
    canvasDot: '#D9CFBC',
  },
  dark: {
    background: palette.ink[950],
    surface: palette.ink[900],
    surfaceRaised: palette.ink[800],
    surfaceSunken: '#0A0914',
    border: palette.ink[700],
    borderStrong: palette.ink[600],
    text: '#EEE8DB',
    textMuted: '#ADA7BC',
    textSubtle: '#817B93',
    accent: palette.thread[400],
    accentHover: palette.thread[300],
    accentSoft: 'rgba(255, 106, 77, 0.12)',
    onAccent: '#1B0A06',
    brass: palette.brass[400],
    brassSoft: 'rgba(217, 178, 106, 0.14)',
    success: palette.moss[400],
    warning: palette.amber[400],
    danger: palette.crimson[400],
    info: '#6FB3B8',
    focus: palette.thread[400],
    overlay: 'rgba(5, 5, 12, 0.7)',
    canvas: '#0C0B18',
    canvasDot: '#26233F',
  },
};

/** Thèmes de lecture, indépendants du thème de l'interface. */
export type ReaderThemeName = 'paper' | 'sepia' | 'night' | 'contrast';

export interface ReaderTheme {
  readonly background: string;
  readonly page: string;
  readonly text: string;
  readonly muted: string;
  readonly accent: string;
  readonly rule: string;
}

export const readerThemes: Readonly<Record<ReaderThemeName, ReaderTheme>> = {
  paper: {
    background: palette.paper[300],
    page: palette.paper[50],
    text: '#221F33',
    muted: '#6B6679',
    accent: palette.thread[600],
    rule: '#E2D8C4',
  },
  sepia: {
    background: '#E8D9BA',
    page: '#F4E8CF',
    text: '#3B2F20',
    muted: '#66563F',
    accent: '#B0391F',
    rule: '#DCC9A4',
  },
  night: {
    background: '#08070F',
    page: palette.ink[950],
    text: '#D9D3C6',
    muted: '#8A8497',
    accent: palette.thread[400],
    rule: palette.ink[800],
  },
  contrast: {
    background: '#000000',
    page: '#000000',
    text: '#FFFFFF',
    muted: '#E0E0E0',
    accent: '#FFD60A',
    rule: '#FFFFFF',
  },
};

/** Couleurs associées aux types de fin (badges, graphe, statistiques). */
export const endingColors = {
  victory: palette.moss[500],
  defeat: palette.slate[600],
  death: palette.crimson[800],
  neutral: palette.sepia[500],
  secret: palette.amethyst[500],
} as const;

/** Couleurs catégorielles des genres (couvertures générées, pastilles). */
export const genreColors = {
  fantasy: '#5B4BA8',
  mystery: '#2E3A59',
  thriller: '#8C2417',
  romance: '#B8436B',
  'science-fiction': '#1F6F8B',
  horror: '#3B1F2B',
  adventure: '#A0652A',
  youth: '#3E8E6A',
  drama: '#6A4C7A',
  historical: '#7F5E22',
  poetry: '#9A5A8A',
  experimental: '#2F6F73',
} as const;

export type Genre = keyof typeof genreColors;
