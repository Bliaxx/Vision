import { oc } from '@orpc/contract';
import { z } from 'zod';
import { OkSchema } from './common';
import * as account from './schemas/account';
import * as authoring from './schemas/authoring';
import { AnalysisSummarySchema } from './schemas/authoring';
import * as billing from './schemas/billing';
import * as catalog from './schemas/catalog';
import * as community from './schemas/community';
import * as moderation from './schemas/moderation';
import * as muse from './schemas/muse';
import * as reading from './schemas/reading';

/**
 * Erreurs métier typées, communes à toutes les procédures. Les clients
 * (web, mobile, partenaires) les reçoivent avec leur code et leurs données.
 */
const base = oc.errors({
  UNAUTHORIZED: { status: 401, message: 'Authentification requise' },
  FORBIDDEN: { status: 403, message: 'Action non autorisée' },
  NOT_FOUND: { status: 404, message: 'Ressource introuvable' },
  TOO_MANY_REQUESTS: { status: 429, message: 'Trop de requêtes, réessayez plus tard' },
});

const publicRead = base.route({ method: 'GET' });

// --- Catalogue public (API partenaires en lecture seule) ------------------

const catalogContract = {
  home: publicRead
    .route({ path: '/catalog/home', summary: "Page d'accueil éditoriale", tags: ['Catalogue'] })
    .output(catalog.HomeSchema),
  list: publicRead
    .route({ path: '/stories', summary: 'Rechercher et parcourir les récits', tags: ['Catalogue'] })
    .input(catalog.CatalogQuerySchema)
    .output(catalog.StoryCardPageSchema),
  story: publicRead
    .route({ path: '/stories/{slug}', summary: "Fiche d'un récit", tags: ['Catalogue'] })
    .input(catalog.StorySlugInputSchema)
    .output(catalog.StoryDetailSchema),
  author: publicRead
    .route({ path: '/authors/{handle}', summary: "Profil public d'un auteur", tags: ['Catalogue'] })
    .input(catalog.HandleInputSchema)
    .output(catalog.AuthorProfileSchema),
};

// --- Lecture ----------------------------------------------------------------

const readingContract = {
  open: publicRead
    .route({
      path: '/reading/{slug}',
      summary: 'Ouvrir un récit (document + sauvegardes)',
      tags: ['Lecture'],
    })
    .errors({
      PAYMENT_REQUIRED: { status: 402, message: 'Ce récit nécessite un abonnement ou un achat' },
    })
    .input(reading.OpenStoryInputSchema)
    .output(reading.ReadingPackageSchema),
  saveProgress: base
    .route({
      method: 'PUT',
      path: '/reading/saves',
      summary: 'Enregistrer une partie (vérifiée par rejeu)',
      tags: ['Lecture'],
    })
    .errors({
      UNPROCESSABLE_CONTENT: { status: 422, message: 'Sauvegarde incompatible avec cette version' },
    })
    .input(reading.UpsertSaveInputSchema)
    .output(reading.SaveRecordSchema),
  deleteSave: base
    .route({ method: 'POST', path: '/reading/saves/delete', tags: ['Lecture'] })
    .input(reading.DeleteSaveInputSchema)
    .output(OkSchema),
  track: base
    .route({
      method: 'POST',
      path: '/reading/events',
      summary: 'Événements de lecture anonymisés',
      tags: ['Lecture'],
    })
    .input(reading.TrackInputSchema)
    .output(z.object({ accepted: z.number().int() })),
  choiceStats: publicRead
    .route({
      path: '/stories/{storyId}/passages/{passageId}/choice-stats',
      summary: 'Répartition des choix des lecteurs',
      tags: ['Lecture'],
    })
    .input(reading.ChoiceStatsInputSchema)
    .output(reading.ChoiceStatsSchema),
  endings: publicRead
    .route({ path: '/stories/{storyId}/endings', summary: 'Codex des fins', tags: ['Lecture'] })
    .input(community.StoryRefInputSchema)
    .output(reading.EndingsCodexSchema),
  library: publicRead
    .route({ path: '/me/library', summary: 'Bibliothèque personnelle', tags: ['Lecture'] })
    .output(reading.LibrarySchema),
};

// --- Studio (création) ------------------------------------------------------

const studio = base.errors({
  CONFLICT: {
    status: 409,
    message: 'Le brouillon a été modifié ailleurs',
    data: z.object({ revision: z.number().int() }),
  },
});

const authoringContract = {
  list: studio
    .route({ method: 'GET', path: '/studio/stories', tags: ['Studio'] })
    .output(z.array(authoring.StudioStorySchema)),
  create: studio
    .route({ method: 'POST', path: '/studio/stories', successStatus: 201, tags: ['Studio'] })
    .input(authoring.CreateStoryInputSchema)
    .output(z.object({ id: z.uuid() })),
  get: studio
    .route({ method: 'GET', path: '/studio/stories/{id}', tags: ['Studio'] })
    .input(authoring.StoryIdInputSchema)
    .output(authoring.DraftSchema),
  saveDraft: studio
    .route({
      method: 'PUT',
      path: '/studio/stories/{id}/draft',
      summary: 'Enregistrer le brouillon (concurrence optimiste)',
      tags: ['Studio'],
    })
    .input(authoring.SaveDraftInputSchema)
    .output(authoring.SaveDraftOutputSchema),
  updateMeta: studio
    .route({ method: 'PATCH', path: '/studio/stories/{id}/meta', tags: ['Studio'] })
    .input(authoring.UpdateMetaInputSchema)
    .output(authoring.StoryMetaSchema),
  publish: studio
    .route({
      method: 'POST',
      path: '/studio/stories/{id}/publish',
      summary: 'Publier une nouvelle version',
      tags: ['Studio'],
    })
    .errors({
      UNPROCESSABLE_CONTENT: {
        status: 422,
        message: 'Le récit contient des erreurs bloquantes',
        data: AnalysisSummarySchema,
      },
    })
    .input(authoring.PublishInputSchema)
    .output(authoring.PublishOutputSchema),
  unpublish: studio
    .route({ method: 'POST', path: '/studio/stories/{id}/unpublish', tags: ['Studio'] })
    .input(authoring.StoryIdInputSchema)
    .output(OkSchema),
  remove: studio
    .route({ method: 'DELETE', path: '/studio/stories/{id}', tags: ['Studio'] })
    .input(authoring.StoryIdInputSchema)
    .output(OkSchema),
  importTwee: studio
    .route({
      method: 'POST',
      path: '/studio/import/twee',
      summary: 'Importer un récit Twine (Twee 3)',
      tags: ['Studio'],
    })
    .errors({ UNPROCESSABLE_CONTENT: { status: 422, message: 'Fichier Twee illisible' } })
    .input(authoring.ImportTweeInputSchema)
    .output(authoring.ImportOutputSchema),
  exportGamebook: studio
    .route({
      method: 'GET',
      path: '/studio/stories/{id}/gamebook',
      summary: 'Export livre-jeu numéroté',
      tags: ['Studio'],
    })
    .input(authoring.StoryIdInputSchema)
    .output(authoring.GamebookOutputSchema),
  analytics: studio
    .route({ method: 'GET', path: '/studio/stories/{id}/analytics', tags: ['Studio'] })
    .input(authoring.StoryIdInputSchema)
    .output(authoring.StoryAnalyticsSchema),
  feedback: studio
    .route({ method: 'GET', path: '/studio/stories/{id}/feedback', tags: ['Studio'] })
    .input(authoring.StoryIdInputSchema)
    .output(z.array(authoring.FeedbackSchema)),
  resolveFeedback: studio
    .route({ method: 'POST', path: '/studio/feedback/{id}/resolve', tags: ['Studio'] })
    .input(authoring.ResolveFeedbackInputSchema)
    .output(OkSchema),
};

// --- Communauté -------------------------------------------------------------

const communityContract = {
  reviews: publicRead
    .route({ path: '/stories/{storyId}/reviews', tags: ['Communauté'] })
    .input(community.ListReviewsInputSchema)
    .output(community.ReviewPageSchema),
  upsertReview: base
    .route({ method: 'PUT', path: '/stories/{storyId}/review', tags: ['Communauté'] })
    .input(community.UpsertReviewInputSchema)
    .output(community.ReviewSchema),
  deleteReview: base
    .route({ method: 'DELETE', path: '/stories/{storyId}/review', tags: ['Communauté'] })
    .input(community.StoryRefInputSchema)
    .output(OkSchema),
  toggleFavorite: base
    .route({ method: 'POST', path: '/stories/{storyId}/favorite', tags: ['Communauté'] })
    .input(community.StoryRefInputSchema)
    .output(community.ToggleOutputSchema),
  toggleFollow: base
    .route({ method: 'POST', path: '/authors/{handle}/follow', tags: ['Communauté'] })
    .input(community.FollowInputSchema)
    .output(community.ToggleOutputSchema),
  sendFeedback: base
    .route({
      method: 'POST',
      path: '/stories/{storyId}/feedback',
      summary: "Retour privé à l'auteur",
      tags: ['Communauté'],
    })
    .input(community.SendFeedbackInputSchema)
    .output(OkSchema),
  report: base
    .route({ method: 'POST', path: '/reports', successStatus: 201, tags: ['Communauté'] })
    .input(community.CreateReportInputSchema)
    .output(OkSchema),
};

// --- Compte & abonnements ---------------------------------------------------

const accountContract = {
  me: publicRead.route({ path: '/me', tags: ['Compte'] }).output(account.MeSchema),
  updateProfile: base
    .route({ method: 'PATCH', path: '/me/profile', tags: ['Compte'] })
    .errors({ CONFLICT: { status: 409, message: 'Cet identifiant est déjà pris' } })
    .input(account.UpdateProfileInputSchema)
    .output(account.ProfileSchema),
};

const billingContract = {
  plans: publicRead
    .route({ path: '/billing/plans', tags: ['Abonnements'] })
    .output(z.array(billing.PlanOfferSchema)),
  checkout: base
    .route({ method: 'POST', path: '/billing/checkout', tags: ['Abonnements'] })
    .input(billing.CheckoutInputSchema)
    .output(billing.RedirectSchema),
  portal: base
    .route({ method: 'POST', path: '/billing/portal', tags: ['Abonnements'] })
    .output(billing.RedirectSchema),
};

// --- Muse (assistante d'écriture IA) ----------------------------------------

const museContract = {
  suggestChoices: base
    .route({
      method: 'POST',
      path: '/muse/choices',
      summary: 'Proposer des embranchements',
      tags: ['Muse'],
    })
    .errors({
      PAYMENT_REQUIRED: { status: 402, message: "Muse est incluse dans l'offre Architecte" },
      SERVICE_UNAVAILABLE: { status: 503, message: 'Muse est momentanément indisponible' },
    })
    .input(muse.MuseInputSchema)
    .output(muse.ChoiceSuggestionsSchema),
  critique: base
    .route({
      method: 'POST',
      path: '/muse/critique',
      summary: 'Relecture éditoriale d’un passage',
      tags: ['Muse'],
    })
    .errors({
      PAYMENT_REQUIRED: { status: 402, message: "Muse est incluse dans l'offre Architecte" },
      SERVICE_UNAVAILABLE: { status: 503, message: 'Muse est momentanément indisponible' },
    })
    .input(muse.MuseInputSchema)
    .output(muse.CritiqueSchema),
};

// --- Modération -------------------------------------------------------------

const moderationContract = {
  queue: publicRead
    .route({ path: '/moderation/reports', tags: ['Modération'] })
    .input(moderation.ReportQueueInputSchema)
    .output(moderation.ReportPageSchema),
  resolve: base
    .route({ method: 'POST', path: '/moderation/reports/{id}/resolve', tags: ['Modération'] })
    .input(moderation.ResolveReportInputSchema)
    .output(OkSchema),
};

export const contract = {
  catalog: catalogContract,
  reading: readingContract,
  authoring: authoringContract,
  community: communityContract,
  account: accountContract,
  billing: billingContract,
  muse: museContract,
  moderation: moderationContract,
};

export type Contract = typeof contract;
