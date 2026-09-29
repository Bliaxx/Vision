import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/** Négociation de la langue et réécriture des URLs localisées. */
export default createMiddleware(routing);

export const config = {
  // Tout sauf l'API, les fichiers internes de Next, les fichiers statiques et
  // les images de métadonnées générées (leurs URLs internes portent déjà la locale).
  matcher: '/((?!api|_next|_vercel|apple-icon|.*opengraph-image|.*\\..*).*)',
};
