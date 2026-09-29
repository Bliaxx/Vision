'use client';

import type { ReaderThemeName } from '@dedale/tokens';
import { readingSizes } from '@dedale/tokens';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export interface ReaderPreferences {
  theme: ReaderThemeName;
  font: 'reading' | 'accessible' | 'dyslexia';
  size: number;
}

const DEFAULTS: ReaderPreferences = { theme: 'paper', font: 'reading', size: 20 };
const KEY = 'dedale:reader';

/** Préférences de lecture, mémorisées sur l'appareil. */
export function useReaderPreferences() {
  const [preferences, setPreferences] = useState<ReaderPreferences>(DEFAULTS);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored)
        setPreferences({ ...DEFAULTS, ...(JSON.parse(stored) as Partial<ReaderPreferences>) });
      else if (
        document.documentElement.dataset.theme === 'dark' ||
        matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        setPreferences({ ...DEFAULTS, theme: 'night' });
      }
    } catch {
      // Préférences indisponibles : valeurs par défaut.
    }
  }, []);
  const update = (patch: Partial<ReaderPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Ignoré : navigation privée.
      }
      return next;
    });
  };
  return [preferences, update] as const;
}

export function readerStyle(preferences: ReaderPreferences): React.CSSProperties {
  const font = {
    reading: 'var(--dd-font-reading)',
    accessible: 'var(--dd-font-accessible)',
    dyslexia: 'var(--dd-font-dyslexia)',
  }[preferences.font];
  return {
    ['--reader-font' as string]: font,
    ['--reader-size' as string]: `${preferences.size / 16}rem`,
    ['--reader-leading' as string]: preferences.font === 'reading' ? '1.75' : '1.85',
  };
}

const THEMES: { id: ReaderThemeName; swatch: string; ink: string }[] = [
  { id: 'paper', swatch: '#FFFDF8', ink: '#221F33' },
  { id: 'sepia', swatch: '#F4E8CF', ink: '#3B2F20' },
  { id: 'night', swatch: '#0F0E1C', ink: '#D9D3C6' },
  { id: 'contrast', swatch: '#000000', ink: '#FFD60A' },
];

export function ReaderSettings({
  preferences,
  onChange,
}: {
  preferences: ReaderPreferences;
  onChange: (patch: Partial<ReaderPreferences>) => void;
}) {
  const t = useTranslations('reader');
  const themeLabel = {
    paper: t('themePaper'),
    sepia: t('themeSepia'),
    night: t('themeNight'),
    contrast: t('themeContrast'),
  };
  const fonts = [
    { id: 'reading' as const, label: t('fontReading'), family: 'var(--dd-font-reading)' },
    { id: 'accessible' as const, label: t('fontAccessible'), family: 'var(--dd-font-accessible)' },
    { id: 'dyslexia' as const, label: t('fontDyslexia'), family: 'var(--dd-font-dyslexia)' },
  ];
  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="eyebrow mb-2">{t('theme')}</legend>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              aria-pressed={preferences.theme === theme.id}
              onClick={() => onChange({ theme: theme.id })}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-2 text-xs font-semibold',
                preferences.theme === theme.id
                  ? 'border-thread ring-2 ring-thread/25'
                  : 'border-line',
              )}
            >
              <span
                className="flex size-10 items-center justify-center rounded-md border border-line font-display text-lg"
                style={{ background: theme.swatch, color: theme.ink }}
              >
                Aa
              </span>
              {themeLabel[theme.id]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="eyebrow mb-2">{t('font')}</legend>
        {fonts.map((font) => (
          <label
            key={font.id}
            className={cn(
              'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5',
              preferences.font === font.id ? 'border-thread' : 'border-line',
            )}
          >
            <span style={{ fontFamily: font.family }} className="text-lg">
              {font.label}
            </span>
            <input
              type="radio"
              name="reader-font"
              className="accent-thread"
              checked={preferences.font === font.id}
              onChange={() => onChange({ font: font.id })}
            />
          </label>
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="eyebrow mb-2">{t('fontSize')}</legend>
        <div className="flex items-center gap-3">
          <span className="text-sm">A</span>
          <input
            type="range"
            min={0}
            max={readingSizes.length - 1}
            step={1}
            value={Math.max(
              0,
              readingSizes.indexOf(preferences.size as (typeof readingSizes)[number]),
            )}
            onChange={(event) => onChange({ size: readingSizes[Number(event.target.value)] ?? 20 })}
            className="flex-1 accent-thread"
            aria-label={t('fontSize')}
          />
          <span className="text-2xl">A</span>
        </div>
      </fieldset>
    </div>
  );
}
