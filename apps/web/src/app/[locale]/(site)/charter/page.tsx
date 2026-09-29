import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/charter'>): Promise<Metadata> {
  const t = await getTranslations({
    locale: toLocale((await params).locale),
    namespace: 'charter',
  });
  return { title: t('title'), description: t('intro') };
}

export default async function CharterPage({ params }: PageProps<'/[locale]/charter'>) {
  setRequestLocale(toLocale((await params).locale));
  const t = await getTranslations('charter');
  const rules = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'] as const;
  return (
    <Container className="flex max-w-3xl flex-col gap-8 py-16">
      <h1 className="font-display text-5xl font-semibold">{t('title')}</h1>
      <p className="text-lg text-muted">{t('intro')}</p>
      <ol className="flex flex-col gap-4">
        {rules.map((rule, index) => (
          <li key={rule} className="flex gap-4 rounded-xl border border-line bg-surface p-5">
            <span className="font-display text-3xl font-semibold text-thread">{index + 1}</span>
            <p className="pt-1.5 leading-relaxed">{t(`rules.${rule}`)}</p>
          </li>
        ))}
      </ol>
    </Container>
  );
}
