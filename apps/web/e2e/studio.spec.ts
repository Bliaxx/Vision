import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

test('écrire, enregistrer et tester une nouvelle histoire', async ({ page }) => {
  await page.goto('/');
  await signIn(page, 'aurore@demo.dedale.app');
  await page.goto('/studio');

  await page.getByRole('button', { name: 'Nouvelle histoire' }).click();
  await page.getByLabel('Titre').fill(`Essai ${Date.now()}`);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page).toHaveURL(/\/studio\/[0-9a-f-]{36}$/);
  await expect(page.locator('.react-flow__node').first()).toBeVisible();

  // Modifier le titre du passage de départ déclenche la sauvegarde automatique.
  await page.getByLabel('Titre du passage').fill('Le seuil');
  await expect(page.getByRole('status').filter({ hasText: 'Enregistré' })).toBeVisible({
    timeout: 10_000,
  });

  // Test en conditions réelles, dans la liseuse.
  await page.getByRole('button', { name: 'Tester' }).click();
  await page.getByRole('menuitem', { name: 'Depuis le début' }).click();
  await expect(page.getByText('Mode test').first()).toBeVisible();
});
