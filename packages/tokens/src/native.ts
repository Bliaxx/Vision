import {
  type ColorScheme,
  endingColors,
  genreColors,
  type ReaderThemeName,
  readerThemes,
  type SemanticColors,
  semantic,
} from './colors';
import { radii, spacing } from './layout';
import { bezier, durations } from './motion';
import { fontSizes, lineHeights, type ReadingFont } from './typography';

/**
 * Noms des polices tels que chargés par `@expo-google-fonts/*` dans l'app
 * mobile (une famille par graisse sur iOS/Android).
 */
export const nativeFonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  displayBlack: 'Fraunces_800ExtraBold',
  reading: 'Literata_400Regular',
  readingItalic: 'Literata_400Regular_Italic',
  readingBold: 'Literata_700Bold',
  ui: 'Manrope_500Medium',
  uiRegular: 'Manrope_400Regular',
  uiBold: 'Manrope_700Bold',
  accessible: 'AtkinsonHyperlegibleNext_400Regular',
  accessibleBold: 'AtkinsonHyperlegibleNext_700Bold',
  dyslexia: 'Lexend_400Regular',
  dyslexiaBold: 'Lexend_700Bold',
} as const;

export const readingFontFamilies: Readonly<
  Record<ReadingFont, { regular: string; italic: string; bold: string }>
> = {
  reading: {
    regular: nativeFonts.reading,
    italic: nativeFonts.readingItalic,
    bold: nativeFonts.readingBold,
  },
  accessible: {
    regular: nativeFonts.accessible,
    italic: nativeFonts.accessible,
    bold: nativeFonts.accessibleBold,
  },
  dyslexia: {
    regular: nativeFonts.dyslexia,
    italic: nativeFonts.dyslexia,
    bold: nativeFonts.dyslexiaBold,
  },
};

export interface NativeTheme {
  readonly scheme: ColorScheme;
  readonly colors: SemanticColors;
  readonly endings: typeof endingColors;
  readonly genres: typeof genreColors;
  readonly fonts: typeof nativeFonts;
  readonly sizes: typeof fontSizes;
  readonly lineHeights: typeof lineHeights;
  readonly space: typeof spacing;
  readonly radii: typeof radii;
  readonly durations: typeof durations;
  readonly bezier: typeof bezier;
}

export function nativeTheme(scheme: ColorScheme): NativeTheme {
  return {
    scheme,
    colors: semantic[scheme],
    endings: endingColors,
    genres: genreColors,
    fonts: nativeFonts,
    sizes: fontSizes,
    lineHeights,
    space: spacing,
    radii,
    durations,
    bezier,
  };
}

export function readerPalette(name: ReaderThemeName) {
  return readerThemes[name];
}
