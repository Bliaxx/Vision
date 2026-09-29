import type { ReactNode } from 'react';
import { Text as NativeText, type TextProps } from 'react-native';
import { useTheme } from '@/theme/theme';

type Variant =
  | 'hero'
  | 'display'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'eyebrow'
  | 'mono';
type Tone = 'default' | 'muted' | 'subtle' | 'accent' | 'onAccent' | 'danger' | 'success';

/**
 * Typographie de l'interface : Fraunces pour les titres, Manrope pour le reste.
 * Le texte suit la taille système (Dynamic Type), plafonnée pour les titres.
 */
export function Text({
  variant = 'body',
  tone = 'default',
  style,
  children,
  ...props
}: TextProps & { variant?: Variant; tone?: Tone; children?: ReactNode }) {
  const { colors, fonts } = useTheme();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    subtle: colors.textSubtle,
    accent: colors.accent,
    onAccent: colors.onAccent,
    danger: colors.danger,
    success: colors.success,
  }[tone];
  const base = {
    hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
    display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 33, letterSpacing: -0.4 },
    title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 25 },
    body: { fontFamily: fonts.uiRegular, fontSize: 16, lineHeight: 23 },
    bodyStrong: { fontFamily: fonts.uiBold, fontSize: 16, lineHeight: 23 },
    caption: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18 },
    eyebrow: {
      fontFamily: fonts.uiBold,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 1.6,
      textTransform: 'uppercase' as const,
    },
    mono: { fontFamily: 'Menlo', fontSize: 13, lineHeight: 18 },
  }[variant];
  const heading = variant === 'hero' || variant === 'display' || variant === 'title';
  return (
    <NativeText
      accessibilityRole={heading ? 'header' : undefined}
      maxFontSizeMultiplier={heading ? 1.4 : 2}
      style={[
        base,
        { color: variant === 'eyebrow' && tone === 'default' ? colors.accent : color },
        style,
      ]}
      {...props}
    >
      {children}
    </NativeText>
  );
}
