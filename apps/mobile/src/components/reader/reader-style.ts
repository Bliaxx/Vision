import { type ReaderTheme, readerThemes } from '@dedale/tokens';
import { readingFontFamilies } from '@dedale/tokens/native';
import { usePreferences } from '@/lib/preferences';

export interface ReaderStyle {
  readonly palette: ReaderTheme;
  readonly font: { regular: string; italic: string; bold: string };
  readonly size: number;
  readonly lineHeight: number;
}

/** Ambiance de lecture (indépendante du thème de l'interface). */
export function useReaderStyle(): ReaderStyle {
  const { readerTheme, readerFont, readerSize } = usePreferences();
  return {
    palette: readerThemes[readerTheme],
    font: readingFontFamilies[readerFont],
    size: readerSize,
    lineHeight: Math.round(readerSize * 1.62),
  };
}
