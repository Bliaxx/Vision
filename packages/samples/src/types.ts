import type { StoryInput } from '@dedale/engine';

export interface SampleStory {
  readonly slug: string;
  readonly author: 'aurore' | 'malik' | 'ines' | 'theo';
  readonly meta: {
    readonly tagline: string;
    readonly synopsis: string;
    readonly genres: readonly string[];
    readonly tags: readonly string[];
    readonly ageRating: 'all' | '10' | '13' | '16';
    readonly contentWarnings: readonly string[];
    readonly access: 'free' | 'premium' | 'paid';
    readonly priceCents: number | null;
    readonly license: string;
  };
  readonly document: StoryInput;
}

export interface SampleAuthor {
  readonly key: SampleStory['author'];
  readonly name: string;
  readonly handle: string;
  readonly email: string;
  readonly bio: string;
}
