import { apiErrorCode } from '@dedale/api-client';
import type {
  EndingsCodex,
  Review,
  StoryCard as StoryCardData,
  StoryDetail,
} from '@dedale/contracts';
import type { EndingKind } from '@dedale/engine';
import {
  AlertTriangle,
  Bot,
  CalendarDays,
  Clock,
  Globe2,
  Scale,
  Trophy,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { StoryCover } from '@/components/brand/story-cover';
import { AccessBadge, DifficultyMeter, EndingIcon } from '@/components/story/badges';
import { EndingsCodexView } from '@/components/story/endings-codex';
import { Rating, Stars } from '@/components/story/rating';
import { Reviews } from '@/components/story/reviews';
import { StoryActions } from '@/components/story/story-actions';
import { StoryRail } from '@/components/story/story-card';
import { Badge } from '@/components/ui/badge';
import { Avatar, Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';
import { getPathname, Link } from '@/i18n/navigation';
import { serverApi } from '@/lib/api/server';
import { formatDate, formatPercent } from '@/lib/format';
import { getMe } from '@/lib/session';

async function loadStory(slug: string): Promise<StoryDetail> {
  const api = await serverApi();
  try {
    return await api.catalog.story({ slug });
  } catch (error) {
    if (apiErrorCode(error) === 'NOT_FOUND') notFound();
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/story/[slug]'>): Promise<Metadata> {
  const { slug, locale } = await params;
  const story = await loadStory(slug);
  const path = getPathname({
    locale: toLocale(locale),
    href: { pathname: '/story/[slug]', params: { slug } },
  });
  return {
    title: story.title,
    description: story.tagline ?? story.synopsis.slice(0, 160),
    alternates: { canonical: path },
    openGraph: {
      type: 'book',
      title: story.title,
      description: story.tagline ?? undefined,
      url: path,
    },
  };
}

export default async function StoryPage({ params }: PageProps<'/[locale]/story/[slug]'>) {
  const { slug, locale: segment } = await params;
  const locale = toLocale(segment);
  setRequestLocale(locale);
  const [story, me, t, api] = await Promise.all([
    loadStory(slug),
    getMe(),
    getTranslations(),
    serverApi(),
  ]);
  const [reviews, codex, more] = await Promise.all([
    api.community
      .reviews({ storyId: story.id, limit: 10 })
      .catch(() => ({ items: [] as Review[], nextCursor: null })),
    api.reading.endings({ storyId: story.id }).catch(() => null as EndingsCodex | null),
    api.catalog
      .list({ author: story.author.handle, limit: 8, sort: 'top' })
      .then((page) => page.items.filter((item) => item.id !== story.id))
      .catch(() => [] as StoryCardData[]),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: story.title,
    description: story.synopsis,
    inLanguage: story.language,
    genre: story.genres.map((genre) => t(`genres.${genre}`)),
    author: { '@type': 'Person', name: story.author.displayName },
    datePublished: story.publishedAt ?? undefined,
    bookFormat: 'https://schema.org/EBook',
    isAccessibleForFree: story.access === 'free',
    ...(story.stats.rating !== null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: story.stats.rating,
            reviewCount: story.stats.ratingCount,
          },
        }
      : {}),
  };

  const details = [
    {
      icon: Clock,
      label: t('story.duration'),
      value: t('common.minutes', { count: story.stats.minutes }),
    },
    {
      icon: Trophy,
      label: t('story.difficulty'),
      value: <DifficultyMeter difficulty={story.stats.difficulty} />,
    },
    { icon: Users, label: t('story.age'), value: t(`ageRatings.${story.ageRating}`) },
    {
      icon: Globe2,
      label: t('story.language'),
      value: story.language === 'fr' ? 'Français' : 'English',
    },
    { icon: Scale, label: t('story.license'), value: t(`licenses.${story.license}`) },
    { icon: Bot, label: t('story.aiLabel'), value: t(`aiUsage.${story.aiUsage}`) },
    {
      icon: CalendarDays,
      label: t('story.version', { number: story.version.number }),
      value: formatDate(story.version.publishedAt, locale),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Container className="grid gap-12 py-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
        <div className="mx-auto w-full max-w-sm lg:sticky lg:top-24 lg:self-start">
          <StoryCover
            slug={story.slug}
            title={story.title}
            genre={story.genres[0]}
            author={story.author.displayName}
            coverUrl={story.coverUrl}
            size="lg"
            className="dog-ear shadow-lift"
          />
        </div>
        <div className="flex flex-col gap-10">
          <header className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              {story.genres.map((genre) => (
                <Link key={genre} href={`/explore?genre=${genre}` as '/explore'}>
                  <Badge tone="outline" className="hover:border-ink">
                    {t(`genres.${genre}`)}
                  </Badge>
                </Link>
              ))}
              <AccessBadge access={story.access} />
            </div>
            <h1 className="font-display text-5xl leading-[1.02] font-semibold sm:text-6xl">
              {story.title}
            </h1>
            {story.tagline ? (
              <p className="font-display text-2xl text-muted italic">{story.tagline}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={{ pathname: '/author/[handle]', params: { handle: story.author.handle } }}
                className="group inline-flex items-center gap-3"
              >
                <Avatar name={story.author.displayName} src={story.author.avatarUrl} size={40} />
                <span className="flex flex-col">
                  <span className="thread-underline font-semibold">{story.author.displayName}</span>
                  <span className="text-xs text-subtle">@{story.author.handle}</span>
                </span>
              </Link>
              <Rating value={story.stats.rating} count={story.stats.ratingCount} />
              <span className="text-sm text-muted">
                {t('common.reads', { count: story.stats.reads })}
              </span>
            </div>
            <StoryActions story={story} signedIn={me !== null} />
          </header>

          <section
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            aria-label={t('story.details')}
          >
            {details.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-4"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-subtle">
                  <Icon className="size-3.5" aria-hidden /> {label}
                </span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
            <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-4">
              <span className="text-xs font-semibold text-subtle">{t('story.endings')}</span>
              <span className="flex flex-wrap gap-2 text-sm font-semibold">
                {(Object.entries(story.details.endingsByKind) as [EndingKind, number][])
                  .filter(([, count]) => count > 0)
                  .map(([kind, count]) => (
                    <span
                      key={kind}
                      className="inline-flex items-center gap-1"
                      title={t(`endings.${kind}`)}
                    >
                      <EndingIcon kind={kind} /> {count}
                    </span>
                  ))}
              </span>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-display text-3xl font-semibold">{t('story.synopsis')}</h2>
            <p className="max-w-2xl text-lg leading-relaxed whitespace-pre-line text-ink/90">
              {story.synopsis}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <span>{t('common.passages', { count: story.details.passages })}</span>
              <span>{t('common.words', { count: story.details.words })}</span>
              <span>{t('story.achievements', { count: story.details.achievements })}</span>
              <span>
                {t('story.failureRate', {
                  percent: formatPercent(story.details.failureRate, locale),
                })}
              </span>
            </div>
            {story.contentWarnings.length > 0 ? (
              <p className="inline-flex flex-wrap items-center gap-2 text-sm">
                <AlertTriangle className="size-4 text-warning" aria-hidden />
                <span className="font-semibold">{t('story.contentWarnings')} :</span>
                {story.contentWarnings
                  .map((warning) => t(`contentWarnings.${warning}`))
                  .join(' · ')}
              </p>
            ) : null}
          </section>

          {codex ? (
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-3xl font-semibold">{t('story.codex')}</h2>
              <EndingsCodexView codex={codex} />
            </section>
          ) : null}

          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold">{t('story.reviews')}</h2>
              {story.stats.rating !== null ? (
                <div className="flex items-center gap-4">
                  <span className="font-display text-5xl font-semibold">
                    {story.stats.rating.toFixed(1)}
                  </span>
                  <div className="flex flex-col gap-1">
                    <Stars value={story.stats.rating} />
                    <span className="text-xs text-muted">
                      {t('common.ratings', { count: story.stats.ratingCount })}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
            <Reviews
              storyId={story.id}
              initial={reviews.items}
              myRating={story.viewer?.myRating ?? null}
              canReview={me !== null && me.user.id !== story.author.id}
            />
          </section>
        </div>
      </Container>
      {more.length > 0 ? (
        <Container className="pb-8">
          <StoryRail title={t('story.moreBy')} stories={more} />
        </Container>
      ) : null}
    </>
  );
}
