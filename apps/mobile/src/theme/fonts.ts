import { nativeFonts } from '@dedale/tokens/native';
import { AtkinsonHyperlegibleNext_400Regular } from '@expo-google-fonts/atkinson-hyperlegible-next/400Regular';
import { AtkinsonHyperlegibleNext_700Bold } from '@expo-google-fonts/atkinson-hyperlegible-next/700Bold';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_600SemiBold_Italic } from '@expo-google-fonts/fraunces/600SemiBold_Italic';
import { Fraunces_800ExtraBold } from '@expo-google-fonts/fraunces/800ExtraBold';
import { Lexend_400Regular } from '@expo-google-fonts/lexend/400Regular';
import { Lexend_700Bold } from '@expo-google-fonts/lexend/700Bold';
import { Literata_400Regular } from '@expo-google-fonts/literata/400Regular';
import { Literata_400Regular_Italic } from '@expo-google-fonts/literata/400Regular_Italic';
import { Literata_700Bold } from '@expo-google-fonts/literata/700Bold';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';

/**
 * Polices embarquées, importées graisse par graisse (seules celles-ci entrent
 * dans le bundle). Les noms correspondent à `nativeFonts` des tokens.
 */
export const appFonts: Record<(typeof nativeFonts)[keyof typeof nativeFonts], number> = {
  [nativeFonts.display]: Fraunces_600SemiBold,
  [nativeFonts.displayItalic]: Fraunces_600SemiBold_Italic,
  [nativeFonts.displayBlack]: Fraunces_800ExtraBold,
  [nativeFonts.reading]: Literata_400Regular,
  [nativeFonts.readingItalic]: Literata_400Regular_Italic,
  [nativeFonts.readingBold]: Literata_700Bold,
  [nativeFonts.ui]: Manrope_500Medium,
  [nativeFonts.uiRegular]: Manrope_400Regular,
  [nativeFonts.uiBold]: Manrope_700Bold,
  [nativeFonts.accessible]: AtkinsonHyperlegibleNext_400Regular,
  [nativeFonts.accessibleBold]: AtkinsonHyperlegibleNext_700Bold,
  [nativeFonts.dyslexia]: Lexend_400Regular,
  [nativeFonts.dyslexiaBold]: Lexend_700Bold,
};
