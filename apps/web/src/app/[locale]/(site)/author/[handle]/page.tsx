import { apiErrorCode } from '@dedale/api-client';
import type { AuthorProfile } from '@dedale/contracts';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { StoryGrid } from '@/components/story/story-card';
import { Avatar, Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';
import { serverApi } from '@/lib/api/server';
import { formatDate, formatNumber } from '@/lib/format';

async function loadAuthor(handle: string): Promise<AuthorProfile> {
  const api = await serverApi();
  try {
    return await api.catalog.author({ handle });
  } catch (error) {
    if (apiErrorCode(error) === 'NOT_FOUND') notFound();
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/author/[handle]'>): Promise<Metadata> {
  const author = await loadAuthor((await params).handle);
  return { title: author.displayName, description: author.bio ?? undefined };
}

export default async function AuthorPage({ params }: PageProps<'/[locale]/author/[handle]'>) {
  const { handle, locale: segment } = await params;
  const locale = toLocale(segment);
  setRequestLocale(locale);
  const [author, t] = await Promise.all([loadAuthor(handle), getTranslations()]);
  return (
    <Container className="flex flex-col gap-12 py-12">
      <header className="flex flex-col items-start gap-6 rounded-3xl border border-line bg-surface p-8 sm:flex-row sm:items-center">
        <Avatar name={author.displayName} src={author.avatarUrl} size={96} />
        <div className="flex flex-1 flex-col gap-2">
          <h1 className="font-display text-4xl font-semibold">{author.displayName}</h1>
          <p className="text-sm text-subtle">
            @{author.handle} · {t('author.joined', { date: formatDate(author.joinedAt, locale) })}
          </p>
          {author.bio ? <p className="max-w-2xl leading-relaxed text-muted">{author.bio}</p> : null}
        </div>
        <dl className="flex gap-8">
          <div>
            <dt className="text-xs font-semibold text-subtle">{t('author.stories')}</dt>
            <dd className="font-display text-3xl font-semibold">{author.totals.stories}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-subtle">{t('landing.statsReads')}</dt>
            <dd className="font-display text-3xl font-semibold">
              {formatNumber(author.totals.reads, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-subtle">{t('author.followersLabel')}</dt>
            <dd className="font-display text-3xl font-semibold">{author.followers}</dd>
          </div>
        </dl>
      </header>
      {author.stories.length === 0 ? (
        <p className="text-muted italic">{t('author.noStories')}</p>
      ) : (
        <StoryGrid stories={author.stories} />
      )}
    </Container>
  );
}
