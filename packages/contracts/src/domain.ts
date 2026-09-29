import { z } from 'zod';

/** Genres éditoriaux. La narration interactive ne se limite pas à l'aventure. */
export const GENRES = [
  'fantasy',
  'mystery',
  'thriller',
  'romance',
  'science-fiction',
  'horror',
  'adventure',
  'youth',
  'drama',
  'historical',
  'poetry',
  'experimental',
] as const;
export const GenreSchema = z.enum(GENRES);
export type Genre = z.infer<typeof GenreSchema>;

/** Classification d'âge (pas de contenu adulte : charte éthique). */
export const AGE_RATINGS = ['all', '10', '13', '16'] as const;
export const AgeRatingSchema = z.enum(AGE_RATINGS);
export type AgeRating = z.infer<typeof AgeRatingSchema>;

/** Modèle d'accès d'un récit. */
export const ACCESS_MODELS = ['free', 'premium', 'paid'] as const;
export const AccessModelSchema = z.enum(ACCESS_MODELS);
export type AccessModel = z.infer<typeof AccessModelSchema>;

export const STORY_STATUSES = ['draft', 'published', 'unlisted', 'suspended', 'archived'] as const;
export const StoryStatusSchema = z.enum(STORY_STATUSES);
export type StoryStatus = z.infer<typeof StoryStatusSchema>;

/** Licences : droits d'auteur classiques ou Creative Commons. */
export const LICENSES = [
  'all-rights-reserved',
  'cc-by',
  'cc-by-sa',
  'cc-by-nc',
  'cc-by-nc-sa',
  'cc0',
] as const;
export const LicenseSchema = z.enum(LICENSES);
export type License = z.infer<typeof LicenseSchema>;

/** Transparence sur l'usage de l'IA (étiquette affichée aux lecteurs). */
export const AI_USAGES = ['none', 'assisted', 'generated'] as const;
export const AiUsageSchema = z.enum(AI_USAGES);
export type AiUsage = z.infer<typeof AiUsageSchema>;

export const DIFFICULTIES = ['gentle', 'balanced', 'challenging', 'brutal'] as const;
export const DifficultySchema = z.enum(DIFFICULTIES);

export const CONTENT_WARNINGS = [
  'violence',
  'death',
  'fear',
  'grief',
  'self-harm',
  'addiction',
  'discrimination',
] as const;
export const ContentWarningSchema = z.enum(CONTENT_WARNINGS);

export const USER_ROLES = ['reader', 'author', 'moderator', 'admin'] as const;
export const UserRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const HandleSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/, 'minuscules, chiffres et _ uniquement');

export const SlugSchema = z
  .string()
  .min(1)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const UuidSchema = z.uuid();
export const IsoDateSchema = z.iso.datetime({ offset: true });
export const LocaleSchema = z.enum(['fr', 'en']);

/** Ordre de l'âge : un profil « 13 » peut lire « all », « 10 » et « 13 ». */
export function isAgeRatingAllowed(rating: AgeRating, maxRating: AgeRating): boolean {
  return AGE_RATINGS.indexOf(rating) <= AGE_RATINGS.indexOf(maxRating);
}
