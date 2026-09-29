/** Préférence de thème, mémorisée dans un cookie pour être appliquée dès le rendu serveur. */
export const THEME_COOKIE = 'dedale-theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export function parseTheme(value: string | undefined): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}
