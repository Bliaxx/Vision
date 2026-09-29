'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { THEME_COOKIE, type ThemePreference } from '@/lib/theme';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const ONE_YEAR = 60 * 60 * 24 * 365;

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  // Cookie (et non localStorage) : le serveur rend directement le bon thème.
  // biome-ignore lint/suspicious/noDocumentCookie: l'API Cookie Store n'est pas encore disponible partout.
  document.cookie =
    theme === 'system'
      ? `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`
      : `${THEME_COOKIE}=${theme}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function ThemeToggle({ initial }: { initial: ThemePreference }) {
  const t = useTranslations('nav');
  const [theme, setTheme] = useState<ThemePreference>(initial);

  const choose = (next: ThemePreference) => {
    setTheme(next);
    applyTheme(next);
  };

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('theme')}>
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-40">
        <DropdownMenuItem onSelect={() => choose('light')}>
          <Sun /> {t('themeLight')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => choose('dark')}>
          <Moon /> {t('themeDark')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => choose('system')}>
          <Monitor /> {t('themeSystem')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
