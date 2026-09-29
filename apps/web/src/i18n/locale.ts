import type { Locale } from '@dedale/i18n';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

/** Normalise le segment `[locale]` (chaîne) en locale typée. */
export function toLocale(value: string): Locale {
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}
