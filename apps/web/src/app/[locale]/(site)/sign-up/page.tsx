import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthForm } from '@/components/account/auth-form';
import { AuthShell } from '@/components/account/auth-shell';
import { toLocale } from '@/i18n/locale';

export const metadata: Metadata = { robots: { index: false } };

export default async function SignUpPage({ params }: PageProps<'/[locale]/sign-up'>) {
  setRequestLocale(toLocale((await params).locale));
  const t = await getTranslations('auth');
  return (
    <AuthShell title={t('signUpTitle')} subtitle={t('signUpSubtitle')}>
      <AuthForm mode="sign-up" />
    </AuthShell>
  );
}
