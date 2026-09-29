import { getTranslations } from 'next-intl/server';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export default async function SiteLayout({ children }: LayoutProps<'/[locale]'>) {
  const t = await getTranslations('common');
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-thread focus:px-4 focus:py-2 focus:text-on-thread"
      >
        {t('skipToContent')}
      </a>
      <SiteHeader />
      <main id="contenu">{children}</main>
      <SiteFooter />
    </>
  );
}
