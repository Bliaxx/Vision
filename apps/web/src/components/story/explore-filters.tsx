'use client';

import { AGE_RATINGS, GENRES } from '@dedale/contracts';
import { Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { NativeSelect } from '../ui/field';

/** Filtres du catalogue, synchronisés avec l'URL (partageables, indexables). */
export function ExploreFilters() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('cursor');
    startTransition(() => {
      // @ts-expect-error -- chemin courant sans paramètre dynamique.
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  const genre = params.get('genre') ?? '';
  return (
    <div className={cn('flex flex-col gap-5 transition-opacity', pending && 'opacity-60')}>
      <search>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            update('q', String(new FormData(event.currentTarget).get('q') ?? '').trim());
          }}
        >
          <label className="relative block">
            <span className="sr-only">{t('explore.searchPlaceholder')}</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <input
              name="q"
              type="search"
              defaultValue={params.get('q') ?? ''}
              placeholder={t('explore.searchPlaceholder')}
              className="h-14 w-full rounded-xl border border-line-strong bg-raised pr-4 pl-12 font-display text-xl outline-none placeholder:text-subtle focus-visible:border-thread focus-visible:ring-4 focus-visible:ring-thread/15"
            />
          </label>
        </form>
      </search>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{t('explore.genre')}</legend>
        <button
          type="button"
          onClick={() => update('genre', '')}
          aria-pressed={genre === ''}
          className={cn(
            'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
            genre === '' ? 'border-ink bg-ink text-bg' : 'border-line-strong hover:border-ink',
          )}
        >
          {t('explore.allGenres')}
        </button>
        {GENRES.map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => update('genre', candidate === genre ? '' : candidate)}
            aria-pressed={genre === candidate}
            className={cn(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
              genre === candidate
                ? 'border-thread bg-thread text-on-thread'
                : 'border-line-strong hover:border-ink',
            )}
          >
            {t(`genres.${candidate}`)}
          </button>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          {t('explore.sort')}
          <NativeSelect
            className="h-9 w-auto"
            value={params.get('sort') ?? 'trending'}
            onChange={(event) =>
              update('sort', event.target.value === 'trending' ? '' : event.target.value)
            }
          >
            <option value="trending">{t('explore.sortTrending')}</option>
            <option value="new">{t('explore.sortNew')}</option>
            <option value="top">{t('explore.sortTop')}</option>
            <option value="short">{t('explore.sortShort')}</option>
          </NativeSelect>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          {t('explore.access')}
          <NativeSelect
            className="h-9 w-auto"
            value={params.get('access') ?? ''}
            onChange={(event) => update('access', event.target.value)}
          >
            <option value="">{t('explore.allAccess')}</option>
            <option value="free">{t('access.free')}</option>
            <option value="premium">{t('access.premium')}</option>
            <option value="paid">{t('access.paid')}</option>
          </NativeSelect>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          {t('explore.age')}
          <NativeSelect
            className="h-9 w-auto"
            value={params.get('age') ?? ''}
            onChange={(event) => update('age', event.target.value)}
          >
            <option value="">{t('explore.allAges')}</option>
            {AGE_RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                {t(`ageRatings.${rating}`)}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          {t('explore.language')}
          <NativeSelect
            className="h-9 w-auto"
            value={params.get('lang') ?? ''}
            onChange={(event) => update('lang', event.target.value)}
          >
            <option value="">{t('explore.allLanguages')}</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </NativeSelect>
        </label>
      </div>
    </div>
  );
}
