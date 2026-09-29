import type { Home } from '@dedale/contracts';
import { landingDemo } from '@dedale/samples';
import {
  BookOpenText,
  Check,
  Dices,
  Feather,
  GitBranch,
  Infinity as InfinityIcon,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { GraphIllustration } from '@/components/brand/graph-illustration';
import { Monogram } from '@/components/brand/monogram';
import { DemoReader } from '@/components/reader/demo-reader';
import { StoryRail } from '@/components/story/story-card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';
import { Link } from '@/i18n/navigation';
import { publicApi } from '@/lib/api/server';
import { formatNumber } from '@/lib/format';

async function loadHome(): Promise<Home | null> {
  try {
    return await publicApi().catalog.home();
  } catch {
    return null;
  }
}

/** Fil décoratif qui serpente derrière le héros (tracé à l'affichage). */
function HeroThread() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 700"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 -z-10 size-full opacity-70"
    >
      <path
        d="M-40 520 C 160 420, 260 640, 420 540 S 640 260, 760 360 S 980 620, 1080 420 S 1180 140, 1260 180"
        fill="none"
        stroke="var(--dd-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
        className="animate-thread [--thread-length:1] [animation-duration:2.4s]"
      />
    </svg>
  );
}

export default async function LandingPage({ params }: PageProps<'/[locale]'>) {
  setRequestLocale(toLocale((await params).locale));
  const [t, tRails, home, currentLocale] = await Promise.all([
    getTranslations('landing'),
    getTranslations('rails'),
    loadHome(),
    getLocale(),
  ]);
  const demo = currentLocale === 'en' ? landingDemo.en : landingDemo.fr;
  const picks = home?.rails.find((rail) => rail.key === 'staff-picks');
  const trending = home?.rails.find((rail) => rail.key === 'trending');

  return (
    <>
      {/* --- Héros --------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden">
        <HeroThread />
        <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="flex animate-rise flex-col gap-7">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className="font-display text-[clamp(2.6rem,6.2vw,5.4rem)] leading-[0.98] font-semibold [font-variation-settings:'SOFT'_60,'WONK'_1]">
              {t.rich('title', {
                thread: (chunks) => <em className="text-thread italic">{chunks}</em>,
              })}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted">{t('subtitle')}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/explore">
                  <BookOpenText /> {t('ctaRead')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/studio">
                  <Feather /> {t('ctaWrite')}
                </Link>
              </Button>
            </div>
            {home ? (
              <dl className="flex flex-wrap gap-x-10 gap-y-4 pt-2">
                {[
                  { value: home.totals.stories, label: t('statsStories') },
                  { value: home.totals.authors, label: t('statsAuthors') },
                  { value: home.totals.reads, label: t('statsReads') },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-xs font-semibold text-subtle">{stat.label}</dt>
                    <dd className="font-display text-3xl font-semibold tabular-nums">
                      {formatNumber(stat.value, currentLocale)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
          <section aria-labelledby="demo-title" className="relative flex flex-col gap-3 lg:pl-6">
            <div className="flex items-baseline justify-between gap-3 px-1">
              <h2 id="demo-title" className="font-display text-xl font-semibold">
                {t('demoTitle')}
              </h2>
              <p className="text-xs text-muted">{t('demoSubtitle')}</p>
            </div>
            <div className="lg:rotate-[0.6deg]">
              <DemoReader input={demo} />
            </div>
          </section>
        </Container>
      </section>

      {/* --- Catalogue ------------------------------------------------------------ */}
      {picks || trending ? (
        <Container className="flex flex-col gap-16 py-10">
          {picks ? <StoryRail title={tRails('staff-picks')} stories={picks.stories} /> : null}
          {trending ? <StoryRail title={tRails('trending')} stories={trending.stories} /> : null}
        </Container>
      ) : null}

      {/* --- Lecteurs ------------------------------------------------------------- */}
      <section className="mt-16 bg-night text-parchment" data-theme="dark">
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <p className="eyebrow">{t('readersEyebrow')}</p>
            <h2 className="font-display text-4xl font-semibold sm:text-5xl">{t('readersTitle')}</h2>
            <p className="text-lg leading-relaxed text-[var(--dd-text-muted)]">
              {t('readersBody')}
            </p>
            <ul className="flex flex-col gap-3">
              {[t('readersPoint1'), t('readersPoint2'), t('readersPoint3')].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-thread" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Dices, title: '2d6', body: t('featureDice') },
              { icon: GitBranch, title: '62 %', body: t('featureStats') },
              { icon: Sparkles, title: '5', body: t('featureEndings') },
              { icon: Smartphone, title: t('featureOffline'), body: t('featureOfflineBody') },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-xl border border-[var(--dd-border)] bg-[var(--dd-surface)] p-5"
              >
                <Icon className="size-6 text-thread" aria-hidden />
                <p className="font-display text-3xl font-semibold">{title}</p>
                <p className="text-sm text-[var(--dd-text-muted)]">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* --- Auteurs --------------------------------------------------------------- */}
      <Container className="grid items-center gap-12 py-24 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <GraphIllustration labels={t('graphLabels').split('|')} />
        </div>
        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <p className="eyebrow">{t('authorsEyebrow')}</p>
          <h2 className="font-display text-4xl font-semibold sm:text-5xl">{t('authorsTitle')}</h2>
          <p className="text-lg leading-relaxed text-muted">{t('authorsBody')}</p>
          <ul className="flex flex-col gap-3">
            {[t('authorsPoint1'), t('authorsPoint2'), t('authorsPoint3')].map((point) => (
              <li key={point} className="flex items-start gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-thread" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div>
            <Button asChild size="lg">
              <Link href="/studio">
                <Feather /> {t('ctaWrite')}
              </Link>
            </Button>
          </div>
        </div>
      </Container>

      {/* --- Écoles ----------------------------------------------------------------- */}
      <Container>
        <section className="relative overflow-hidden rounded-3xl bg-brass-soft px-8 py-14 sm:px-14">
          <div className="flex max-w-2xl flex-col gap-5">
            <p className="eyebrow !text-brass">{t('schoolsEyebrow')}</p>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t('schoolsTitle')}</h2>
            <p className="text-lg text-muted">{t('schoolsBody')}</p>
            <div>
              <Button asChild variant="secondary">
                <Link href="/schools">{t('schoolsCta')}</Link>
              </Button>
            </div>
          </div>
          <Monogram
            size={260}
            className="absolute -right-10 -bottom-12 hidden text-brass opacity-25 md:block"
            title=""
            aria-hidden
          />
        </section>
      </Container>

      {/* --- Engagements --------------------------------------------------------------- */}
      <Container className="flex flex-col gap-10 py-24">
        <h2 className="text-center font-display text-4xl font-semibold">{t('valuesTitle')}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Dices, title: t('value1Title'), body: t('value1Body') },
            { icon: InfinityIcon, title: t('value2Title'), body: t('value2Body') },
            { icon: Sparkles, title: t('value3Title'), body: t('value3Body') },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="dog-ear flex flex-col gap-3 rounded-lg border border-line bg-surface p-7 shadow-paper"
            >
              <Icon className="size-7 text-thread" aria-hidden />
              <h3 className="font-display text-2xl font-semibold">{title}</h3>
              <p className="leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* --- Appel final ------------------------------------------------------------------ */}
      <Container>
        <section className="flex flex-col items-center gap-7 rounded-3xl border border-line bg-surface px-6 py-20 text-center shadow-paper">
          <Monogram size={88} animated className="text-ink" />
          <h2 className="font-display text-5xl font-semibold italic">{t('finalTitle')}</h2>
          <Button asChild size="lg">
            <Link href="/explore">{t('finalCta')}</Link>
          </Button>
        </section>
      </Container>
    </>
  );
}
