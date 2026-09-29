import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ReportQueue } from '@/components/moderation/report-queue';
import { Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';
import { redirect } from '@/i18n/navigation';
import { getMe } from '@/lib/session';

export const metadata: Metadata = { robots: { index: false } };

export default async function ModerationPage({ params }: PageProps<'/[locale]/moderation'>) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const [me, t] = await Promise.all([getMe(), getTranslations('moderation')]);
  if (!me) redirect({ href: '/sign-in', locale });
  if (me && me.user.role !== 'moderator' && me.user.role !== 'admin')
    redirect({ href: '/', locale });
  return (
    <Container className="flex max-w-4xl flex-col gap-8 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-5xl font-semibold">{t('title')}</h1>
        <p className="text-muted">{t('subtitle')}</p>
      </header>
      <ReportQueue />
    </Container>
  );
}
