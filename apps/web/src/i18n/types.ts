import type { Locale, Messages } from '@dedale/i18n';
import type { routing } from './routing';

/** Typage strict des clés de traduction et des locales dans toute l'application. */
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
    Routing: typeof routing;
  }
}
