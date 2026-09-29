'use client';

import { createApiClient, createQueryUtils } from '@dedale/api-client';

/** Client navigateur : l'API est servie sous la même origine (`/api`). */
export const api = createApiClient({
  baseUrl: typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
  credentials: 'same-origin',
});

export const orpc = createQueryUtils(api);
