import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthForm } from '@/components/account/auth-form';
import { AuthShell } from '@/components/account/auth-shell';
import { toLocale } from '@/i18n/locale';

export const metadata: Metadata = { robots: { index: false } };

export default async function SignInPage({ params }: PageProps<'/[locale]/sign-in'>) {
  setRequestLocale(toLocale((await params).locale));
  const t = await getTranslations('auth');
  return (
    <AuthShell
      title={t('signInTitle')}
      subtitle={t('signInSubtitle')}
      aside={
        <p className="rounded-lg border border-dashed border-line-strong p-3 text-center text-xs text-muted">
          {t('demoHint')}
        </p>
      }
    >
      <AuthForm mode="sign-in" />
    </AuthShell>
  );
}
