import {
  Atkinson_Hyperlegible_Next,
  Fraunces,
  JetBrains_Mono,
  Lexend,
  Literata,
  Manrope,
} from 'next/font/google';

// Polices auto-hébergées par Next au build : aucune requête vers Google côté lecteur (RGPD).
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-display',
  display: 'swap',
});
const literata = Literata({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  variable: '--font-reading',
  display: 'swap',
});
const manrope = Manrope({ subsets: ['latin'], variable: '--font-ui', display: 'swap' });
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ['latin'],
  variable: '--font-accessible',
  display: 'swap',
  // Next ne connaît pas encore ses métriques : pas de police de repli ajustée.
  adjustFontFallback: false,
});
const lexend = Lexend({ subsets: ['latin'], variable: '--font-dyslexia', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const fontVariables = [fraunces, literata, manrope, atkinson, lexend, jetbrains]
  .map((font) => font.variable)
  .join(' ');
