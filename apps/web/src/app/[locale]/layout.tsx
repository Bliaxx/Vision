import { brand } from '@dedale/tokens';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Providers } from '@/components/providers';
import { toLocale } from '@/i18n/locale';
import { routing } from '@/i18n/routing';
import { getThemePreference } from '@/lib/theme-server';
import { fontVariables } from '../fonts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: 'landing' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `Dédale — ${common('tagline')}`, template: '%s · Dédale' },
    description: t('subtitle'),
    applicationName: 'Dédale',
    openGraph: { siteName: 'Dédale', type: 'website', locale: locale === 'fr' ? 'fr_FR' : 'en_US' },
    twitter: { card: 'summary_large_image' },
    alternates: { languages: { fr: '/', en: '/en' } },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: brand.themeColor.light },
    { media: '(prefers-color-scheme: dark)', color: brand.themeColor.dark },
  ],
  colorScheme: 'light dark',
};

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale: segment } = await params;
  if (!hasLocale(routing.locales, segment)) notFound();
  const locale = toLocale(segment);
  setRequestLocale(locale);
  const theme = await getThemePreference();

  return (
    <html
      lang={locale}
      className={fontVariables}
      // Thème choisi explicitement ; sinon, celui du système (media query CSS).
      data-theme={theme === 'system' ? undefined : theme}
    >
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
