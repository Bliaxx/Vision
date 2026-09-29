import { AGE_RATINGS, type CatalogQuery, GENRES } from '@dedale/contracts';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Monogram } from '@/components/brand/monogram';
import { ExploreFilters } from '@/components/story/explore-filters';
import { ExploreResults } from '@/components/story/explore-results';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/misc';
import { toLocale } from '@/i18n/locale';
import { Link } from '@/i18n/navigation';
import { publicApi } from '@/lib/api/server';

type Search = Record<string, string | string[] | undefined>;

function toQuery(search: Search): Omit<CatalogQuery, 'cursor'> {
  const value = (key: string) =>
    typeof search[key] === 'string' ? (search[key] as string) : undefined;
  const genre = value('genre');
  const sort = value('sort');
  const access = value('access');
  const age = value('age');
  return {
    limit: 20,
    sort: sort === 'new' || sort === 'top' || sort === 'short' ? sort : 'trending',
    ...(value('q') ? { q: value('q') } : {}),
    ...(genre && (GENRES as readonly string[]).includes(genre)
      ? { genre: genre as CatalogQuery['genre'] }
      : {}),
    ...(access === 'free' || access === 'premium' || access === 'paid' ? { access } : {}),
    ...(age && (AGE_RATINGS as readonly string[]).includes(age)
      ? { maxAgeRating: age as CatalogQuery['maxAgeRating'] }
      : {}),
    ...(value('lang') ? { language: value('lang') } : {}),
  };
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/explore'>): Promise<Metadata> {
  const t = await getTranslations({
    locale: toLocale((await params).locale),
    namespace: 'explore',
  });
  return { title: t('title'), description: t('subtitle') };
}

export default async function ExplorePage({
  params,
  searchParams,
}: PageProps<'/[locale]/explore'>) {
  setRequestLocale(toLocale((await params).locale));
  const [t, search] = await Promise.all([getTranslations('explore'), searchParams]);
  const query = toQuery(search);
  const page = await publicApi()
    .catalog.list(query)
    .catch(() => ({ items: [], nextCursor: null }));

  return (
    <Container className="flex flex-col gap-10 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-5xl font-semibold">{t('title')}</h1>
        <p className="text-lg text-muted">{t('subtitle')}</p>
      </header>
      <ExploreFilters />
      <p className="text-sm font-semibold text-muted" aria-live="polite">
        {t('results', { count: page.items.length })}
        {page.nextCursor ? '+' : ''}
      </p>
      {page.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line-strong px-6 py-20 text-center">
          <Monogram size={56} className="text-subtle" title="" aria-hidden />
          <p className="font-display text-2xl font-semibold">{t('empty')}</p>
          <p className="max-w-md text-muted">{t('emptyHint')}</p>
          <Button asChild variant="secondary">
            <Link href="/studio">Studio</Link>
          </Button>
        </div>
      ) : (
        <ExploreResults
          key={JSON.stringify(query)}
          initial={page.items}
          nextCursor={page.nextCursor}
          query={query}
        />
      )}
    </Container>
  );
}
