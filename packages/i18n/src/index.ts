import en from '../messages/en.json';
import fr from '../messages/fr.json';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

/** Le français est la langue de référence : les autres catalogues s'y conforment. */
export type Messages = typeof fr;

export const messages: Readonly<Record<Locale, Messages>> = { fr, en };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** Choisit la meilleure langue disponible à partir d'une liste de préférences. */
export function negotiateLocale(preferences: readonly string[]): Locale {
  for (const preference of preferences) {
    const base = preference.toLowerCase().split(/[-_]/)[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

export const localeNames: Readonly<Record<Locale, string>> = {
  fr: 'Français',
  en: 'English',
};
