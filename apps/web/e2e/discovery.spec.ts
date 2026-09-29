import { expect, test } from '@playwright/test';

test.describe('découverte', () => {
  test("l'accueil présente la promesse et un récit jouable", async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('le fil');
    const demo = page.getByRole('region', { name: 'Essayez, là, maintenant' });
    const firstTitle = await demo.locator('.eyebrow').first().textContent();
    await demo.getByRole('button').first().click();
    await expect(demo.locator('.eyebrow').first()).not.toHaveText(firstTitle ?? '');
  });

  test('la recherche tolère les accents manquants', async ({ page }) => {
    await page.goto('/explorer?q=phare%20brumes');
    await expect(page.getByRole('link', { name: /Le Phare des Brumes/ }).first()).toBeVisible();
  });

  test("l'anglais a ses propres URLs", async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.goto('/en/story/le-phare-des-brumes');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Le Phare des Brumes');
  });

  test('une URL inconnue affiche la page 404 localisée', async ({ page }) => {
    const response = await page.goto('/un-chemin-perdu');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Ce chemin ne mène nulle part.',
    );
  });
});
