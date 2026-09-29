import { type NativeTheme, nativeTheme } from '@dedale/tokens/native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { createContext, type ReactNode, use, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { usePreferences } from '@/lib/preferences';

const ThemeContext = createContext<NativeTheme>(nativeTheme('light'));

/** Thème de l'interface : préférence de l'utilisateur, sinon celle du système. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { appearance } = usePreferences();
  const system = useColorScheme();
  const scheme = appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;
  const theme = useMemo(() => nativeTheme(scheme), [scheme]);
  const navigation = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.accent,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.accent,
      },
    };
  }, [scheme, theme]);
  return (
    <ThemeContext value={theme}>
      <NavigationThemeProvider value={navigation}>{children}</NavigationThemeProvider>
    </ThemeContext>
  );
}

export function useTheme(): NativeTheme {
  return use(ThemeContext);
}
