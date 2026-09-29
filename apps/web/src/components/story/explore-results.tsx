'use client';

import type { CatalogQuery, StoryCard as StoryCardData } from '@dedale/contracts';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { api } from '@/lib/api/browser';
import { Button } from '../ui/button';
import { StoryGrid } from './story-card';

/** Première page rendue côté serveur (SEO), pages suivantes chargées à la demande. */
export function ExploreResults({
  initial,
  nextCursor,
  query,
}: {
  initial: StoryCardData[];
  nextCursor: string | null;
  query: Omit<CatalogQuery, 'cursor'>;
}) {
  const t = useTranslations('explore');
  const [stories, setStories] = useState(initial);
  const [cursor, setCursor] = useState(nextCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const page = await api.catalog.list({ ...query, cursor });
      setStories((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="w-full">
        <StoryGrid stories={stories} />
      </div>
      {cursor ? (
        <Button variant="secondary" onClick={loadMore} disabled={loading}>
          {t('loadMore')}
        </Button>
      ) : null}
    </div>
  );
}
