'use client';

import { createAuthClient } from 'better-auth/react';

/** Client d'authentification (routes `/api/auth/*`, même origine). */
export const authClient = createAuthClient({
  baseURL: typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin,
  basePath: '/api/auth',
});
