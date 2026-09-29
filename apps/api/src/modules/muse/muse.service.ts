import type { ChoiceSuggestions, Critique } from '@dedale/contracts';
import { buildGraph } from '@dedale/engine';
import type { Viewer } from '../../http/context';
import {
  NotFoundError,
  PaymentRequiredError,
  RateLimitedError,
  UnavailableError,
} from '../../shared/errors';
import type { RateLimiter } from '../../shared/rate-limiter';
import type { AuthoringService } from '../authoring/authoring.service';
import { type MuseEngine, MuseUnavailableError, type PassageContext } from './muse.port';

/** Assistante d'écriture : droits, quotas et construction du contexte narratif. */
export class MuseService {
  constructor(
    private readonly authoring: AuthoringService,
    private readonly engine: MuseEngine,
    private readonly limiter: RateLimiter,
  ) {}

  private async context(
    viewer: Viewer,
    storyId: string,
    passageId: string,
  ): Promise<PassageContext> {
    if (!viewer.entitlements.has('muse')) {
      throw new PaymentRequiredError("Muse est incluse dans l'offre Architecte");
    }
    if (!this.limiter.consume(`muse:${viewer.id}`, 20, 60 * 60_000)) {
      throw new RateLimitedError('quota horaire de Muse atteint');
    }
    const story = await this.authoring.owned(viewer, storyId);
    const document = story.draft;
    const passage = document.passages.find((candidate) => candidate.id === passageId);
    if (!passage) throw new NotFoundError('passage introuvable');
    const predecessors = buildGraph(document).predecessors.get(passageId) ?? [];
    const previous = [...new Set(predecessors)]
      .slice(0, 3)
      .map((id) => document.passages.find((candidate) => candidate.id === id))
      .filter((candidate) => candidate !== undefined)
      .map((candidate) => ({ title: candidate.title, text: candidate.text.slice(0, 4000) }));
    return {
      storyTitle: story.title,
      language: document.language,
      passage: {
        title: passage.title,
        text: passage.text,
        choices: passage.choices.map((choice) => choice.text),
      },
      previous,
      variables: document.variables.map((variable) => variable.name),
      items: document.items.map((item) => item.name),
    };
  }

  private async run<T>(task: () => Promise<T>): Promise<T> {
    try {
      return await task();
    } catch (error) {
      if (error instanceof MuseUnavailableError) throw new UnavailableError(error.message);
      throw error;
    }
  }

  async suggestChoices(
    viewer: Viewer,
    storyId: string,
    passageId: string,
  ): Promise<ChoiceSuggestions> {
    const context = await this.context(viewer, storyId, passageId);
    return this.run(() => this.engine.suggestChoices(context));
  }

  async critique(viewer: Viewer, storyId: string, passageId: string): Promise<Critique> {
    const context = await this.context(viewer, storyId, passageId);
    return this.run(() => this.engine.critique(context));
  }
}
