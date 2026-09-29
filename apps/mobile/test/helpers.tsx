import type { ReadingPackage } from '@dedale/contracts';
import { StorySchema } from '@dedale/engine';
import { sampleStories } from '@dedale/samples';
import Storage from 'expo-sqlite/kv-store';
import type { ReactNode } from 'react';
import { I18nProvider } from '@/i18n/provider';
import { ThemeProvider } from '@/theme/theme';

export function samplePackage(slug = 'le-phare-des-brumes'): ReadingPackage {
  const sample = sampleStories.find((story) => story.slug === slug);
  if (!sample) throw new Error(`échantillon inconnu : ${slug}`);
  return {
    storyId: '01920000-0000-7000-8000-000000000001',
    slug: sample.slug,
    title: sample.document.title,
    coverUrl: null,
    author: { id: 'a', handle: 'aurore_delsol', displayName: 'Aurore Delsol', avatarUrl: null },
    version: {
      id: '01920000-0000-7000-8000-000000000002',
      number: 1,
      publishedAt: '2026-09-01T00:00:00.000Z',
    },
    document: StorySchema.parse(sample.document),
    saves: [],
    discoveredEndings: [],
  };
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider locale="fr">
      <ThemeProvider>{children}</ThemeProvider>
    </I18nProvider>
  );
}

export function resetStorage() {
  (Storage as unknown as { clear: () => void }).clear();
}
