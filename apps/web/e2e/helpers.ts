import type { Page } from '@playwright/test';

export const DEMO_PASSWORD = 'dedale-demo-2026';

/** Connexion d'un compte de démonstration (cookie de session posé sur le contexte). */
export async function signIn(page: Page, email: string): Promise<void> {
  const response = await page.request.post('/api/auth/sign-in/email', {
    data: { email, password: DEMO_PASSWORD },
    headers: {
      origin: new URL(page.context().pages()[0]?.url() || 'http://localhost:3000').origin,
    },
  });
  if (!response.ok()) throw new Error(`Connexion impossible (${response.status()})`);
}
