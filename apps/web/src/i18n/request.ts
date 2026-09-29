import { messages } from '@dedale/i18n';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    messages: messages[locale],
    timeZone: 'Europe/Paris',
    // Même « maintenant » au rendu serveur et à l'hydratation (dates relatives).
    now: new Date(),
  };
});
