import 'server-only';
import type { Me } from '@dedale/contracts';
import { cache } from 'react';
import { serverApi } from './api/server';

/** Utilisateur connecté (ou `null`), résolu une fois par requête. */
export const getMe = cache(async (): Promise<Me | null> => {
  try {
    const api = await serverApi();
    return await api.account.me();
  } catch {
    return null;
  }
});
