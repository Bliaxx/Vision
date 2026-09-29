import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { StoryCover } from '@/components/brand/story-cover';
import { StoryGrid } from '@/components/story/story-card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';
import { Link, redirect } from '@/i18n/navigation';
import { serverApi } from '@/lib/api/server';
import { getMe } from '@/lib/session';

export const metadata: Metadata = { robots: { index: false } };

export default async function LibraryPage({ params }: PageProps<'/[locale]/library'>) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const me = await getMe();
  if (!me) redirect({ href: '/sign-in', locale });
  const [t, format, api] = await Promise.all([
    getTranslations('library'),
    getFormatter(),
    serverApi(),
  ]);
  const library = await api.reading.library();
  const empty =
    library.inProgress.length + library.finished.length + library.favorites.length === 0;

  return (
    <Container className="flex flex-col gap-12 py-12">
      <h1 className="font-display text-5xl font-semibold">{t('title')}</h1>
      {empty ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line-strong py-20 text-center">
          <p className="font-display text-2xl font-semibold">{t('empty')}</p>
          <Button asChild>
            <Link href="/explore">{t('emptyCta')}</Link>
          </Button>
        </div>
      ) : null}
      {[
        { key: 'inProgress', title: t('inProgress'), entries: library.inProgress },
        { key: 'finished', title: t('finished'), entries: library.finished },
      ].map(({ key, title, entries }) =>
        entries.length > 0 ? (
          <section key={key} className="flex flex-col gap-5">
            <h2 className="font-display text-3xl font-semibold">{title}</h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {entries.map((entry) => (
                <li key={entry.story.id}>
                  <Link
                    href={{
                      pathname: key === 'inProgress' ? '/read/[slug]' : '/story/[slug]',
                      params: { slug: entry.story.slug },
                    }}
                    className="group flex gap-4 rounded-xl border border-line bg-surface p-3 transition-shadow hover:shadow-paper"
                  >
                    <StoryCover
                      slug={entry.story.slug}
                      title={entry.story.title}
                      genre={entry.story.genres[0]}
                      coverUrl={entry.story.coverUrl}
                      size="sm"
                      className="w-20 shrink-0"
                    />
                    <div className="flex flex-col justify-center gap-1">
                      <p className="font-display text-xl font-semibold group-hover:text-thread">
                        {entry.story.title}
                      </p>
                      <p className="text-sm text-muted">
                        {key === 'inProgress'
                          ? t('resumeAt', { title: entry.passageTitle })
                          : t('finishedAt', { title: entry.passageTitle })}
                      </p>
                      <p className="text-xs text-subtle">
                        {format.relativeTime(new Date(entry.updatedAt))}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
      {library.favorites.length > 0 ? (
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-3xl font-semibold">{t('favorites')}</h2>
          <StoryGrid stories={library.favorites} />
        </section>
      ) : null}
    </Container>
  );
}
