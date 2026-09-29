import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProfileForm } from '@/components/account/profile-form';
import { SubscriptionCard } from '@/components/account/subscription-card';
import { Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';
import { redirect } from '@/i18n/navigation';
import { getMe } from '@/lib/session';

export const metadata: Metadata = { robots: { index: false } };

export default async function AccountPage({
  params,
  searchParams,
}: PageProps<'/[locale]/account'>) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const [me, t, search] = await Promise.all([getMe(), getTranslations('account'), searchParams]);
  if (!me) redirect({ href: '/sign-in', locale });
  if (!me) return null;
  return (
    <Container className="flex max-w-4xl flex-col gap-10 py-12">
      <h1 className="font-display text-5xl font-semibold">{t('title')}</h1>
      {search.abonnement === 'active' ? (
        <p role="status" className="rounded-lg bg-success/10 px-4 py-3 font-semibold text-success">
          {t('activated')}
        </p>
      ) : null}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-semibold">{t('subscription')}</h2>
        <SubscriptionCard me={me} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-semibold">{t('profile')}</h2>
        <ProfileForm me={me} />
      </section>
    </Container>
  );
}
