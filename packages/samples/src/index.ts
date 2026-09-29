import { derniereLettre } from './stories/derniere-lettre';
import { jardinDeMila } from './stories/jardin-de-mila';
import { nuitBlanche } from './stories/nuit-blanche';
import { pharesDesBrumes } from './stories/phare-des-brumes';
import { seuilEn, seuilFr } from './stories/seuil';
import { signal } from './stories/signal';
import type { SampleStory } from './types';

export { sampleAuthors } from './authors';
export type { SampleAuthor, SampleStory } from './types';

export const sampleStories: readonly SampleStory[] = [
  pharesDesBrumes,
  nuitBlanche,
  jardinDeMila,
  signal,
  derniereLettre,
];

/** Micro-récit de la page d'accueil, par langue. */
export const landingDemo = { fr: seuilFr, en: seuilEn } as const;
