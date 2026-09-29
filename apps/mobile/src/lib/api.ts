import { createApiClient, createQueryUtils } from '@dedale/api-client';
import { authClient } from './auth';
import { API_URL } from './config';
import { currentLocale } from './locale';

/** Client typé de l'API : cookie de session et langue ajoutés à chaque appel. */
export const api = createApiClient({
  baseUrl: API_URL,
  credentials: 'omit',
  headers: async () => {
    const cookie = await authClient.getCookie();
    return { 'accept-language': currentLocale(), ...(cookie ? { cookie } : {}) };
  },
});

export const orpc = createQueryUtils(api);
