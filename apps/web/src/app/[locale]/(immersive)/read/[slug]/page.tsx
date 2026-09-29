import { apiErrorCode } from '@dedale/api-client';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Reader } from '@/components/reader/reader';
import { toLocale } from '@/i18n/locale';
import { redirect } from '@/i18n/navigation';
import { serverApi } from '@/lib/api/server';
import { getMe } from '@/lib/session';

export const metadata: Metadata = { robots: { index: false } };

export default async function ReadPage({ params }: PageProps<'/[locale]/read/[slug]'>) {
  const { slug, locale: segment } = await params;
  const locale = toLocale(segment);
  setRequestLocale(locale);
  const [api, me] = await Promise.all([serverApi(), getMe()]);
  try {
    const pkg = await api.reading.open({ slug });
    return <Reader pkg={pkg} signedIn={me !== null} />;
  } catch (error) {
    const code = apiErrorCode(error);
    if (code === 'NOT_FOUND') notFound();
    if (code === 'PAYMENT_REQUIRED')
      redirect({ href: { pathname: '/story/[slug]', params: { slug } }, locale });
    throw error;
  }
}
