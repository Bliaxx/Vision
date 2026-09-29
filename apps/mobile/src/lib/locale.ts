import { defaultLocale, type Locale, negotiateLocale } from '@dedale/i18n';
import { getLocales } from 'expo-localization';
import { z } from 'zod';
import { kv } from './kv';

const KEY = 'prefs:locale';
const LocaleSchema = z.enum(['fr', 'en']);

/** Langue choisie dans l'app, sinon celle du téléphone, sinon le français. */
export function currentLocale(): Locale {
  const chosen = kv.read(KEY, LocaleSchema);
  if (chosen) return chosen;
  try {
    return negotiateLocale(getLocales().map((locale) => locale.languageTag));
  } catch {
    return defaultLocale;
  }
}

export function setLocale(locale: Locale): void {
  kv.write(KEY, locale);
}
