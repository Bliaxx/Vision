import { BarChart3, MessageSquareText, PenLine, Star } from 'lucide-react';
import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { GraphIllustration } from '@/components/brand/graph-illustration';
import { StoryCover } from '@/components/brand/story-cover';
import { ImportTwineButton, NewStoryButton } from '@/components/studio/studio-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';
import { Link, redirect } from '@/i18n/navigation';
import { serverApi } from '@/lib/api/server';
import { getMe } from '@/lib/session';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/studio'>): Promise<Metadata> {
  const t = await getTranslations({ locale: toLocale((await params).locale), namespace: 'studio' });
  return { title: t('title'), robots: { index: false } };
}

export default async function StudioPage({ params }: PageProps<'/[locale]/studio'>) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const me = await getMe();
  if (!me) redirect({ href: '/sign-in', locale });
  const [t, tc, tl, format, api] = await Promise.all([
    getTranslations('studio'),
    getTranslations('common'),
    getTranslations('landing'),
    getFormatter(),
    serverApi(),
  ]);
  const stories = await api.authoring.list();

  return (
    <Container className="flex flex-col gap-10 py-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">{t('title')}</p>
          <h1 className="font-display text-5xl font-semibold">{t('subtitle')}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportTwineButton />
          <NewStoryButton />
        </div>
      </header>

      {stories.length === 0 ? (
        <div className="paper-grain flex flex-col items-center gap-6 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
          <GraphIllustration labels={tl('graphLabels').split('|')} className="w-full max-w-xs" />
          <div className="flex flex-col gap-2">
            <p className="font-display text-3xl font-semibold">{t('empty')}</p>
            <p className="max-w-md text-muted">{t('emptyHint')}</p>
          </div>
          <NewStoryButton size="lg" />
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {stories.map((story) => {
            const live = story.status === 'published' || story.status === 'unlisted';
            return (
              <li
                key={story.id}
                className="dog-ear flex gap-4 rounded-xl border border-line bg-surface p-4 shadow-paper"
              >
                <StoryCover
                  slug={story.slug}
                  title={story.title}
                  genre={story.genres[0]}
                  coverUrl={story.coverUrl}
                  size="sm"
                  className="w-24 shrink-0 self-start"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={live ? 'success' : story.status === 'suspended' ? 'danger' : 'neutral'}
                    >
                      {t(`status.${story.status}`)}
                    </Badge>
                    {story.publishedVersion ? (
                      <Badge tone="outline">v{story.publishedVersion}</Badge>
                    ) : null}
                  </div>
                  <h2 className="truncate font-display text-2xl font-semibold">{story.title}</h2>
                  <p className="text-xs text-subtle">
                    {t('updated', { when: format.relativeTime(new Date(story.updatedAt)) })} ·{' '}
                    {tc('passages', { count: story.passages })}
                  </p>
                  {live ? (
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                      <span>{tc('reads', { count: story.reads })}</span>
                      {story.rating !== null ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5 fill-brass text-brass" aria-hidden />{' '}
                          {format.number(story.rating, { maximumFractionDigits: 1 })}
                        </span>
                      ) : null}
                      {story.openFeedback > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-thread">
                          <MessageSquareText className="size-3.5" aria-hidden />{' '}
                          {t('feedbackCount', { count: story.openFeedback })}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Button asChild size="sm">
                      <Link href={{ pathname: '/studio/[id]', params: { id: story.id } }}>
                        <PenLine /> {t('openEditor')}
                      </Link>
                    </Button>
                    {live ? (
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          href={{ pathname: '/studio/[id]/analytics', params: { id: story.id } }}
                        >
                          <BarChart3 /> {t('analytics')}
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
