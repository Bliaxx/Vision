import type { StoryCard as StoryCardData } from '@dedale/contracts';
import { Clock, GitBranch } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { StoryCover } from '../brand/story-cover';
import { AccessBadge } from './badges';
import { Rating } from './rating';

export function StoryCard({
  story,
  className,
  priority,
}: {
  story: StoryCardData;
  className?: string;
  priority?: boolean;
}) {
  const t = useTranslations();
  return (
    <article
      className={cn('group relative flex flex-col gap-3', className)}
      data-priority={priority}
    >
      <Link
        href={{ pathname: '/story/[slug]', params: { slug: story.slug } }}
        className="relative block rounded-md transition-transform duration-300 ease-thread group-hover:-translate-y-1"
      >
        <StoryCover
          slug={story.slug}
          title={story.title}
          genre={story.genres[0]}
          author={story.author.displayName}
          coverUrl={story.coverUrl}
          className="dog-ear transition-shadow duration-300 group-hover:shadow-lift"
        />
        <span className="absolute top-2.5 left-2.5">
          <AccessBadge access={story.access} />
        </span>
        <span className="sr-only">{story.title}</span>
      </Link>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-lg leading-tight font-semibold">
          <Link
            href={{ pathname: '/story/[slug]', params: { slug: story.slug } }}
            className="thread-underline"
          >
            {story.title}
          </Link>
        </h3>
        <p className="text-sm text-muted">{t('common.by', { author: story.author.displayName })}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <Rating value={story.stats.rating} className="text-xs" />
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />{' '}
            {t('common.minutes', { count: story.stats.minutes })}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitBranch className="size-3.5" aria-hidden />{' '}
            {t('common.endings', { count: story.stats.endings })}
          </span>
        </div>
      </div>
    </article>
  );
}

export function StoryGrid({ stories }: { stories: StoryCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  );
}

export function StoryRail({
  title,
  stories,
  href,
}: {
  title: string;
  stories: StoryCardData[];
  href?: string;
}) {
  const t = useTranslations('common');
  return (
    <section className="flex flex-col gap-5" aria-label={title}>
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h2>
        {href ? (
          <a
            href={href}
            className="thread-underline text-sm font-semibold text-muted hover:text-ink"
          >
            {t('seeAll')}
          </a>
        ) : null}
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} className="w-40 shrink-0 snap-start sm:w-48" />
        ))}
      </div>
    </section>
  );
}
