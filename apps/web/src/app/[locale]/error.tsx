'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { LostThread } from '@/components/layout/lost-thread';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations('errors');
  const tc = useTranslations('common');
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="contenu">
      <LostThread title={t('genericTitle')} body={t('genericBody')}>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => retry()}>{tc('retry')}</Button>
          <Button asChild variant="secondary">
            <Link href="/">{t('home')}</Link>
          </Button>
        </div>
        {error.digest ? <p className="font-mono text-xs text-subtle">#{error.digest}</p> : null}
      </LostThread>
    </main>
  );
}
