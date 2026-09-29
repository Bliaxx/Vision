import { getTranslations } from 'next-intl/server';
import { LostThread } from '@/components/layout/lost-thread';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <>
      <SiteHeader />
      <main id="contenu">
        <LostThread title={t('notFoundTitle')} body={t('notFoundBody')}>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/">{t('home')}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/explore">{t('explore')}</Link>
            </Button>
          </div>
        </LostThread>
      </main>
      <SiteFooter />
    </>
  );
}
