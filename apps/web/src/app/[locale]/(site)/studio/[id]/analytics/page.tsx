import { apiErrorCode } from '@dedale/api-client';
import type { StoryAnalytics } from '@dedale/contracts';
import type { Story } from '@dedale/engine';
import { ArrowLeft, PenLine } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { EndingIcon } from '@/components/story/badges';
import { FeedbackList, GamebookExport } from '@/components/studio/analytics-client';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';
import { Link, redirect } from '@/i18n/navigation';
import { serverApi } from '@/lib/api/server';
import { getMe } from '@/lib/session';

export const metadata: Metadata = { robots: { index: false } };

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-5 shadow-paper">
      <p className="text-xs font-bold tracking-[0.12em] text-subtle uppercase">{label}</p>
      <p className="font-display text-4xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Bar({ ratio, color = 'var(--dd-accent)' }: { ratio: number; color?: string }) {
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-sunken">
      <span
        className="block h-full rounded-full"
        style={{ width: `${Math.max(2, ratio * 100)}%`, background: color }}
      />
    </span>
  );
}

/** Histogramme des 30 derniers jours, rendu côté serveur en SVG (aucun JS). */
function DailyChart({
  daily,
  labels,
}: {
  daily: StoryAnalytics['daily'];
  labels: { starts: string; completions: string };
}) {
  const width = 600;
  const height = 160;
  const max = Math.max(1, ...daily.map((day) => day.starts));
  const step = width / Math.max(1, daily.length);
  const barWidth = Math.max(2, step * 0.6);
  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-40 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${labels.starts} / ${labels.completions}`}
      >
        {daily.map((day, index) => {
          const x = index * step + (step - barWidth) / 2;
          const startsHeight = (day.starts / max) * (height - 8);
          const completionsHeight = (day.completions / max) * (height - 8);
          return (
            <g key={day.date}>
              <title>{`${day.date} · ${labels.starts} ${day.starts} · ${labels.completions} ${day.completions}`}</title>
              <rect
                x={x}
                y={height - startsHeight}
                width={barWidth}
                height={startsHeight}
                rx={2}
                fill="var(--dd-border-strong)"
              />
              <rect
                x={x}
                y={height - completionsHeight}
                width={barWidth}
                height={completionsHeight}
                rx={2}
                fill="var(--dd-accent)"
              />
            </g>
          );
        })}
      </svg>
      <figcaption className="flex gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-line-strong" /> {labels.starts}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-thread" /> {labels.completions}
        </span>
      </figcaption>
    </figure>
  );
}

/** Passages où les lecteurs se partagent le plus : l'équilibre des choix (entropie normalisée). */
function contestedChoices(document: Story, analytics: StoryAnalytics) {
  const byPassage = new Map<string, Map<string, number>>();
  for (const entry of analytics.choices) {
    const counts = byPassage.get(entry.passageId) ?? new Map<string, number>();
    counts.set(entry.choiceId, entry.count);
    byPassage.set(entry.passageId, counts);
  }
  return document.passages
    .map((passage) => {
      const counts = byPassage.get(passage.id);
      if (!counts || passage.choices.length < 2) return null;
      const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
      if (total < 3) return null;
      const shares = passage.choices.map((choice) => ({
        id: choice.id,
        text: choice.text,
        share: (counts.get(choice.id) ?? 0) / total,
      }));
      const entropy =
        -shares.reduce((sum, { share }) => (share > 0 ? sum + share * Math.log(share) : sum), 0) /
        Math.log(shares.length);
      return { passage, shares, total, entropy };
    })
    .filter((entry) => entry !== null)
    .sort((a, b) => b.entropy - a.entropy || b.total - a.total)
    .slice(0, 5);
}

export default async function AnalyticsPage({
  params,
}: PageProps<'/[locale]/studio/[id]/analytics'>) {
  const { id, locale: segment } = await params;
  const locale = toLocale(segment);
  setRequestLocale(locale);
  const me = await getMe();
  if (!me) redirect({ href: '/sign-in', locale });
  const [t, ts, format, api] = await Promise.all([
    getTranslations('studio.analyticsPage'),
    getTranslations('studio'),
    getFormatter(),
    serverApi(),
  ]);

  const [draft, analytics, feedback] = await Promise.all([
    api.authoring.get({ id }),
    api.authoring.analytics({ id }),
    api.authoring.feedback({ id }),
  ]).catch((error: unknown) => {
    const code = apiErrorCode(error);
    if (code === 'NOT_FOUND' || code === 'FORBIDDEN' || code === 'BAD_REQUEST') notFound();
    throw error;
  });
  const document = draft.document;
  const titles = Object.fromEntries(
    document.passages.map((passage) => [passage.id, passage.title]),
  );
  const topPassages = [...analytics.passages].sort((a, b) => b.visits - a.visits).slice(0, 10);
  const maxVisits = Math.max(1, ...topPassages.map((entry) => entry.visits));
  const totalEndings = Math.max(
    1,
    analytics.endings.reduce((sum, ending) => sum + ending.count, 0),
  );
  const contested = contestedChoices(document, analytics);

  return (
    <Container className="flex flex-col gap-10 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link
            href="/studio"
            className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden /> {ts('title')}
          </Link>
          <p className="eyebrow">{t('title')}</p>
          <h1 className="font-display text-5xl font-semibold">{draft.meta.title}</h1>
        </div>
        <Button asChild variant="secondary">
          <Link href={{ pathname: '/studio/[id]', params: { id } }}>
            <PenLine /> {ts('openEditor')}
          </Link>
        </Button>
      </header>

      {draft.versions.length === 0 ? (
        <p className="rounded-lg bg-sunken p-4 text-muted">{t('notPublished')}</p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={t('readers')}
          value={format.number(analytics.readers)}
          hint={`${t('starts')} : ${format.number(analytics.starts)}`}
        />
        <Kpi label={t('completions')} value={format.number(analytics.completions)} />
        <Kpi
          label={t('completionRate')}
          value={format.number(analytics.completionRate, {
            style: 'percent',
            maximumFractionDigits: 0,
          })}
        />
        <Kpi
          label={t('rating')}
          value={
            analytics.rating.average === null
              ? '—'
              : format.number(analytics.rating.average, { maximumFractionDigits: 1 })
          }
          hint={analytics.rating.count ? `${analytics.rating.count} ★` : undefined}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
        <h2 className="font-display text-2xl font-semibold">{t('last30')}</h2>
        <DailyChart
          daily={analytics.daily}
          labels={{ starts: t('starts'), completions: t('completions') }}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
          <h2 className="font-display text-2xl font-semibold">{t('endingsTitle')}</h2>
          <ul className="flex flex-col gap-3">
            {analytics.endings.map((ending) => (
              <li key={ending.passageId} className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <EndingIcon kind={ending.kind} /> {ending.title}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {format.number(ending.count / totalEndings, {
                      style: 'percent',
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </span>
                <Bar
                  ratio={ending.count / totalEndings}
                  color={`var(--dd-ending-${ending.kind})`}
                />
              </li>
            ))}
          </ul>
        </section>

        {analytics.advanced ? (
          <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
            <h2 className="font-display text-2xl font-semibold">{t('funnelTitle')}</h2>
            <ol className="flex flex-col gap-3">
              {topPassages.map((entry) => (
                <li key={entry.passageId} className="flex flex-col gap-1.5">
                  <span className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-semibold">
                      {titles[entry.passageId] ?? entry.passageId}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {t('visits', { count: entry.visits })}
                    </span>
                  </span>
                  <Bar ratio={entry.visits / maxVisits} />
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <section className="paper-grain flex flex-col items-start justify-center gap-3 rounded-xl border border-dashed border-brass/50 bg-brass-soft/30 p-6">
            <h2 className="font-display text-2xl font-semibold">{t('advancedTitle')}</h2>
            <p className="text-muted">{t('advancedBody')}</p>
            <Button asChild variant="brass" size="sm">
              <Link href="/pricing">{t('advancedCta')}</Link>
            </Button>
          </section>
        )}
      </div>

      {contested.length > 0 ? (
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
          <h2 className="font-display text-2xl font-semibold">{t('choicesTitle')}</h2>
          <ul className="grid gap-6 md:grid-cols-2">
            {contested.map(({ passage, shares }) => (
              <li key={passage.id} className="flex flex-col gap-2">
                <p className="font-display text-lg font-semibold">{passage.title}</p>
                {shares.map((share) => (
                  <div key={share.id} className="flex flex-col gap-1">
                    <span className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-reading">{share.text}</span>
                      <span className="shrink-0 font-mono text-xs text-muted">
                        {format.number(share.share, { style: 'percent', maximumFractionDigits: 0 })}
                      </span>
                    </span>
                    <Bar ratio={share.share} color="var(--dd-brass)" />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-6">
        <h2 className="font-display text-2xl font-semibold">{t('feedbackTitle')}</h2>
        <FeedbackList initial={feedback} titles={titles} />
      </section>

      <section className="paper-grain flex flex-col items-start gap-3 rounded-xl border border-brass/40 bg-brass-soft/40 p-6">
        <h2 className="font-display text-2xl font-semibold">{t('export')}</h2>
        <p className="max-w-2xl text-muted">{t('exportHint')}</p>
        {me?.entitlements.includes('print_export') ? (
          <GamebookExport storyId={id} slug={draft.slug} />
        ) : (
          <Button asChild variant="brass" size="sm">
            <Link href="/pricing">{t('advancedCta')}</Link>
          </Button>
        )}
      </section>
    </Container>
  );
}
