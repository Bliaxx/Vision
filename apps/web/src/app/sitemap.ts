import type { StoryCard } from '@dedale/contracts';
import { locales } from '@dedale/i18n';
import type { MetadataRoute } from 'next';
import { getPathname } from '@/i18n/navigation';
import { publicApi } from '@/lib/api/server';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600;

type Href = Parameters<typeof getPathname>[0]['href'];

const STATIC_PAGES: { href: Href; priority: number }[] = [
  { href: '/', priority: 1 },
  { href: '/explore', priority: 0.9 },
  { href: '/pricing', priority: 0.6 },
  { href: '/schools', priority: 0.6 },
  { href: '/charter', priority: 0.3 },
];

/** Une entrée par page, avec ses variantes linguistiques (hreflang). */
function entry(
  href: Href,
  extra: Omit<MetadataRoute.Sitemap[number], 'url'>,
): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, SITE_URL + getPathname({ href, locale })]),
  );
  return { url: languages.fr ?? SITE_URL, alternates: { languages }, ...extra };
}

async function publishedStories(): Promise<StoryCard[]> {
  const stories: StoryCard[] = [];
  let cursor: string | undefined;
  try {
    for (let page = 0; page < 40; page++) {
      const result = await publicApi().catalog.list({
        sort: 'new',
        limit: 50,
        ...(cursor ? { cursor } : {}),
      });
      stories.push(...result.items);
      if (!result.nextCursor) break;
      cursor = result.nextCursor;
    }
  } catch {
    // API indisponible (build hors ligne) : le sitemap se limite aux pages fixes.
  }
  return stories;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stories = await publishedStories();
  const authors = [...new Set(stories.map((story) => story.author.handle))];
  return [
    ...STATIC_PAGES.map(({ href, priority }) =>
      entry(href, { changeFrequency: 'weekly', priority }),
    ),
    ...stories.map((story) =>
      entry(
        { pathname: '/story/[slug]', params: { slug: story.slug } },
        {
          ...(story.publishedAt ? { lastModified: story.publishedAt } : {}),
          changeFrequency: 'weekly',
          priority: 0.8,
        },
      ),
    ),
    ...authors.map((handle) =>
      entry(
        { pathname: '/author/[handle]', params: { handle } },
        { changeFrequency: 'weekly', priority: 0.5 },
      ),
    ),
  ];
}
