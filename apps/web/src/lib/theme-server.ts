import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { parseTheme, THEME_COOKIE, type ThemePreference } from './theme';

export const getThemePreference = cache(
  async (): Promise<ThemePreference> => parseTheme((await cookies()).get(THEME_COOKIE)?.value),
);
