import type { ChoiceSuggestions, Critique } from '@dedale/contracts';

/** Contexte narratif transmis à l'assistante (données, jamais instructions). */
export interface PassageContext {
  readonly storyTitle: string;
  readonly language: string;
  readonly passage: {
    readonly title: string;
    readonly text: string;
    readonly choices: readonly string[];
  };
  /** Passages qui mènent à celui-ci (continuité). */
  readonly previous: readonly { readonly title: string; readonly text: string }[];
  readonly variables: readonly string[];
  readonly items: readonly string[];
}

/** Port de l'assistante d'écriture : un adaptateur IA en production, hors ligne en local. */
export interface MuseEngine {
  readonly name: string;
  suggestChoices(context: PassageContext): Promise<ChoiceSuggestions>;
  critique(context: PassageContext): Promise<Critique>;
}

export class MuseUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'MuseUnavailableError';
  }
}
