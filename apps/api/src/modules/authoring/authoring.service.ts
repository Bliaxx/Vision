import type {
  AnalysisSummary,
  Draft,
  Feedback,
  StoryAnalytics,
  StoryMeta,
  StudioStory,
} from '@dedale/contracts';
import { analyzeStory, type Story, StorySchema } from '@dedale/engine';
import { toGamebook } from '@dedale/engine/gamebook';
import { importTwee, TweeImportError } from '@dedale/engine/twee';
import type { Viewer } from '../../http/context';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PaymentRequiredError,
  UnprocessableError,
} from '../../shared/errors';
import { slugify } from '../../shared/slug';
import type { AccountRepository } from '../account/account.repository';
import type { AuthoringQueries } from './authoring.queries';
import { buildVersionStats, checksum, publicationReport, toAnalysisSummary } from './publication';
import type { StoryRecord, StoryRepository } from './story.repository';
import { starterDocument } from './templates';

function metaOf(story: StoryRecord): StoryMeta {
  return {
    title: story.title,
    tagline: story.tagline,
    synopsis: story.synopsis,
    language: story.language,
    genres: story.genres as StoryMeta['genres'],
    tags: story.tags,
    ageRating: story.ageRating,
    contentWarnings: story.contentWarnings as StoryMeta['contentWarnings'],
    access: story.access,
    priceCents: story.priceCents,
    license: story.license as StoryMeta['license'],
    aiUsage: story.aiUsage,
    coverUrl: story.coverUrl,
  };
}

/** Cas d'usage du studio d'écriture. */
export class AuthoringService {
  constructor(
    private readonly stories: StoryRepository,
    private readonly queries: AuthoringQueries,
    private readonly accounts: AccountRepository,
  ) {}

  /** Charge un récit dont l'utilisateur est l'auteur (ou lève une erreur). */
  async owned(viewer: Viewer, id: string): Promise<StoryRecord> {
    const story = await this.stories.findById(id);
    if (!story) throw new NotFoundError('récit introuvable');
    if (story.authorId !== viewer.id && viewer.role !== 'admin') {
      throw new ForbiddenError("vous n'êtes pas l'auteur de ce récit");
    }
    return story;
  }

  list(viewer: Viewer): Promise<StudioStory[]> {
    return this.stories.listByAuthor(viewer.id);
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title, 72);
    let slug = base;
    for (let attempt = 2; await this.stories.slugExists(slug); attempt++)
      slug = `${base}-${attempt}`;
    return slug;
  }

  async create(
    viewer: Viewer,
    input: {
      title: string;
      language: string;
      genres: StoryMeta['genres'];
      template: 'blank' | 'classic';
    },
  ): Promise<{ id: string }> {
    const document = starterDocument(input.title, input.language, input.template);
    const id = await this.stories.insert({
      authorId: viewer.id,
      slug: await this.uniqueSlug(input.title),
      title: input.title,
      language: input.language,
      genres: input.genres,
      draft: document,
    });
    await this.accounts.promoteToAuthor(viewer.id);
    return { id };
  }

  async get(viewer: Viewer, id: string): Promise<Draft> {
    const story = await this.owned(viewer, id);
    const versions = await this.stories.versions(id);
    return {
      id: story.id,
      slug: story.slug,
      status: story.status,
      meta: metaOf(story),
      document: story.draft,
      revision: story.draftRevision,
      updatedAt: story.draftUpdatedAt.toISOString(),
      versions: versions.map((version) => ({
        id: version.id,
        number: version.number,
        changelog: version.changelog,
        publishedAt: version.publishedAt.toISOString(),
      })),
    };
  }

  async saveDraft(
    viewer: Viewer,
    input: { id: string; revision: number; document: Story },
  ): Promise<{ revision: number; updatedAt: string; analysis: AnalysisSummary }> {
    const story = await this.owned(viewer, input.id);
    const document: Story = { ...input.document, title: story.title };
    const saved = await this.stories.saveDraft(input.id, document, input.revision);
    if (!saved) {
      const current = await this.stories.findById(input.id);
      throw new ConflictError('le brouillon a été modifié ailleurs', {
        revision: current?.draftRevision ?? input.revision,
      });
    }
    return {
      revision: saved.revision,
      updatedAt: saved.updatedAt.toISOString(),
      analysis: toAnalysisSummary(analyzeStory(document)),
    };
  }

  async updateMeta(viewer: Viewer, id: string, meta: StoryMeta): Promise<StoryMeta> {
    const story = await this.owned(viewer, id);
    const document = StorySchema.parse({
      ...story.draft,
      title: meta.title,
      language: meta.language,
    });
    await this.stories.updateMeta(id, meta, document);
    return meta;
  }

  async publish(
    viewer: Viewer,
    input: { id: string; changelog?: string | undefined; visibility: 'public' | 'unlisted' },
  ) {
    const story = await this.owned(viewer, input.id);
    const meta = metaOf(story);
    const document: Story = { ...story.draft, title: meta.title, language: meta.language };
    const analysis = publicationReport(document, meta);
    if (!analysis.publishable) {
      throw new UnprocessableError('le récit contient des erreurs bloquantes', analysis);
    }
    if (input.visibility === 'unlisted' && !viewer.entitlements.has('private_publishing')) {
      throw new PaymentRequiredError("la publication privée est incluse dans l'offre Architecte");
    }

    const hash = checksum(document);
    const [latest] = await this.stories.versions(story.id);
    const unchanged = latest && latest.checksum === hash && story.publishedVersionId === latest.id;
    const version = unchanged
      ? latest
      : await this.stories.publishVersion(story.id, {
          document,
          checksum: hash,
          stats: buildVersionStats(document),
          changelog: input.changelog ?? null,
          publishedBy: viewer.id,
          visibility: input.visibility,
        });
    if (unchanged) {
      await this.stories.setStatus(
        story.id,
        input.visibility === 'public' ? 'published' : 'unlisted',
      );
    }
    await this.accounts.promoteToAuthor(viewer.id);
    return {
      version: {
        id: version.id,
        number: version.number,
        changelog: version.changelog,
        publishedAt: version.publishedAt.toISOString(),
      },
      analysis,
    };
  }

  async unpublish(viewer: Viewer, id: string): Promise<void> {
    const story = await this.owned(viewer, id);
    if (!story.publishedVersionId) return;
    // Les lecteurs en cours gardent l'accès (récit archivé), il disparaît du catalogue.
    await this.stories.setStatus(id, 'archived');
  }

  async remove(viewer: Viewer, id: string): Promise<void> {
    const story = await this.owned(viewer, id);
    if (story.publishedVersionId) {
      // Engagement de durabilité : une œuvre publiée n'est jamais détruite.
      await this.stories.setStatus(id, 'archived');
      return;
    }
    await this.stories.delete(id);
  }

  async importTwee(viewer: Viewer, input: { source: string; language: string }) {
    let result: ReturnType<typeof importTwee>;
    try {
      result = importTwee(input.source, { language: input.language });
    } catch (error) {
      if (error instanceof TweeImportError) throw new UnprocessableError(error.message);
      throw error;
    }
    const id = await this.stories.insert({
      authorId: viewer.id,
      slug: await this.uniqueSlug(result.story.title),
      title: result.story.title,
      language: input.language,
      genres: ['adventure'],
      draft: result.story,
    });
    await this.accounts.promoteToAuthor(viewer.id);
    return { id, warnings: [...result.warnings] };
  }

  async exportGamebook(viewer: Viewer, id: string) {
    const story = await this.owned(viewer, id);
    if (!viewer.entitlements.has('print_export')) {
      throw new PaymentRequiredError("l'export livre-jeu est inclus dans l'offre Architecte");
    }
    const book = toGamebook({ ...story.draft, title: story.title });
    return { markdown: book.markdown, sections: book.sections.length };
  }

  async analytics(viewer: Viewer, id: string): Promise<StoryAnalytics> {
    const story = await this.owned(viewer, id);
    const analytics = await this.queries.analytics(id, story.draft);
    // Indicateurs de base pour tous les auteurs ; le détail par passage et par choix
    // (carte de chaleur, choix disputés) fait partie de l'offre Architecte.
    if (viewer.entitlements.has('author_analytics')) return { ...analytics, advanced: true };
    return { ...analytics, advanced: false, passages: [], choices: [] };
  }

  async feedback(viewer: Viewer, id: string): Promise<Feedback[]> {
    await this.owned(viewer, id);
    return this.queries.feedback(id);
  }

  async resolveFeedback(viewer: Viewer, feedbackId: string): Promise<void> {
    const storyId = await this.queries.feedbackStory(feedbackId);
    if (!storyId) throw new NotFoundError('retour introuvable');
    await this.owned(viewer, storyId);
    await this.queries.resolveFeedback(feedbackId);
  }
}
