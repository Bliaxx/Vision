import 'server-only';
import { createApiClient } from '@dedale/api-client';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';

const API_ORIGIN = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

/**
 * Client d'API pour les Server Components : relaie le cookie de session et la
 * langue du visiteur. Mémoïsé par requête.
 */
export const serverApi = cache(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const cookie = cookieStore.toString();
  const language = headerStore.get('accept-language') ?? 'fr';
  return createApiClient({
    baseUrl: API_ORIGIN,
    headers: () => ({ ...(cookie ? { cookie } : {}), 'accept-language': language }),
    credentials: 'omit',
  });
});

/** Client public sans cookie (pages statiques, sitemap, images OpenGraph). */
export const publicApi = () => createApiClient({ baseUrl: API_ORIGIN, credentials: 'omit' });
