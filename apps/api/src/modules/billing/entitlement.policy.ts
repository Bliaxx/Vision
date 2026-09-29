import type { AccessModel, EntitlementReason } from '@dedale/contracts';
import type { Viewer } from '../../http/context';

export interface StoryAccess {
  readonly authorId: string;
  readonly access: AccessModel;
  readonly status: 'draft' | 'published' | 'unlisted' | 'suspended' | 'archived';
}

/**
 * Règle d'accès à la lecture d'un récit — pure, donc testable isolément.
 *
 * - l'auteur et la modération lisent toujours ;
 * - un brouillon ou un récit suspendu n'est pas lisible ; un récit archivé
 * reste lisible (engagement de durabilité : aucune œuvre publiée ne disparaît) ;
 * - gratuit : tout le monde, même sans compte ;
 * - premium : abonnés au catalogue premium ;
 * - payant : acheteurs (les abonnés n'y ont pas accès, l'œuvre est vendue à l'unité).
 */
export function readingAccess(
  story: StoryAccess,
  viewer: Viewer | null,
  hasPurchased: boolean,
): { canRead: boolean; reason: EntitlementReason } {
  const privileged =
    viewer !== null &&
    (viewer.id === story.authorId || viewer.role === 'moderator' || viewer.role === 'admin');
  if (privileged) return { canRead: true, reason: 'author' };
  if (story.status === 'draft' || story.status === 'suspended') {
    return { canRead: false, reason: 'unavailable' };
  }
  switch (story.access) {
    case 'free':
      return { canRead: true, reason: 'free' };
    case 'premium':
      return viewer?.entitlements.has('premium_catalog')
        ? { canRead: true, reason: 'premium' }
        : { canRead: false, reason: 'locked_premium' };
    case 'paid':
      return hasPurchased
        ? { canRead: true, reason: 'purchased' }
        : { canRead: false, reason: 'locked_paid' };
  }
}
