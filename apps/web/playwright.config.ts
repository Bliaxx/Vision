import { defineConfig, devices } from '@playwright/test';

/**
 * Parcours de bout en bout contre un environnement complet (API + base
 * alimentée par `pnpm db:seed`). En local, les serveurs déjà lancés sont réutilisés.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Chromium préinstallé (conteneurs, CI) plutôt que le téléchargement de Playwright.
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: /studio/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: 'pnpm --filter @dedale/api start',
          url: 'http://localhost:4000/health',
          reuseExistingServer: true,
          timeout: 60_000,
        },
        {
          command: 'pnpm start',
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
