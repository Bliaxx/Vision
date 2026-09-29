import { defaultLocale, locales } from '@dedale/i18n';
import { defineRouting } from 'next-intl/routing';

/**
 * URLs localisées : `/explorer` et `/livre/…` en français (sans préfixe),
 * `/en/explore` et `/en/story/…` en anglais. Bon pour le SEO de chaque langue.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',
    '/explore': { fr: '/explorer', en: '/explore' },
    '/story/[slug]': { fr: '/livre/[slug]', en: '/story/[slug]' },
    '/read/[slug]': { fr: '/lire/[slug]', en: '/read/[slug]' },
    '/author/[handle]': { fr: '/auteur/[handle]', en: '/author/[handle]' },
    '/library': { fr: '/bibliotheque', en: '/library' },
    '/studio': '/studio',
    '/studio/[id]': '/studio/[id]',
    '/studio/[id]/analytics': { fr: '/studio/[id]/statistiques', en: '/studio/[id]/analytics' },
    '/pricing': { fr: '/tarifs', en: '/pricing' },
    '/schools': { fr: '/ecoles', en: '/schools' },
    '/sign-in': { fr: '/connexion', en: '/sign-in' },
    '/sign-up': { fr: '/inscription', en: '/sign-up' },
    '/account': { fr: '/compte', en: '/account' },
    '/moderation': '/moderation',
    '/charter': { fr: '/charte', en: '/charter' },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
