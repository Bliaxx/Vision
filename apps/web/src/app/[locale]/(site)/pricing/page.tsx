import { REVENUE_SHARE } from '@dedale/contracts';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PricingTable } from '@/components/pricing/pricing-table';
import { Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';
import { getMe } from '@/lib/session';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/pricing'>): Promise<Metadata> {
  const t = await getTranslations({
    locale: toLocale((await params).locale),
    namespace: 'pricing',
  });
  return { title: t('title'), description: t('subtitle') };
}

export default async function PricingPage({ params }: PageProps<'/[locale]/pricing'>) {
  setRequestLocale(toLocale((await params).locale));
  const [t, me] = await Promise.all([getTranslations('pricing'), getMe()]);
  const authorShare = Math.round(REVENUE_SHARE.subscriptionPool * 100);
  const faq = ['1', '2', '3', '4'] as const;
  return (
    <Container className="flex flex-col gap-20 py-16">
      <header className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
        <h1 className="font-display text-5xl leading-tight font-semibold">{t('title')}</h1>
        <p className="text-lg text-muted">{t('subtitle')}</p>
      </header>
      <PricingTable currentPlan={me?.subscription.plan ?? null} signedIn={me !== null} />

      <section
        className="grid items-center gap-10 rounded-3xl bg-night p-10 text-parchment lg:grid-cols-2"
        data-theme="dark"
      >
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-4xl font-semibold">{t('shareTitle')}</h2>
          <p className="text-lg leading-relaxed text-[var(--dd-text-muted)]">{t('shareBody')}</p>
        </div>
        <div className="flex flex-col gap-4">
          <div
            className="flex h-5 overflow-hidden rounded-full"
            role="img"
            aria-label={`${authorShare} % / ${100 - authorShare} %`}
          >
            <div className="bg-thread" style={{ width: `${authorShare}%` }} />
            <div className="bg-[var(--dd-ink-600)]" style={{ width: `${100 - authorShare}%` }} />
          </div>
          <div className="flex justify-between text-sm">
            <span>
              <strong className="font-display text-3xl text-thread">{authorShare} %</strong>{' '}
              {t('shareAuthor')}
            </span>
            <span className="text-right">
              <strong className="font-display text-3xl">{100 - authorShare} %</strong>{' '}
              {t('sharePlatform')}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <h2 className="font-display text-4xl font-semibold">{t('faqTitle')}</h2>
        <div className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
          {faq.map((key) => (
            <details key={key} className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-semibold">
                {t(`faq.q${key}`)}
                <span className="text-thread transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{t(`faq.a${key}`)}</p>
            </details>
          ))}
        </div>
      </section>
    </Container>
  );
}
