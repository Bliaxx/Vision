import { expect, test } from '@playwright/test';

test('lire un récit gratuit, au clavier, sans compte', async ({ page }) => {
  await page.goto('/livre/le-phare-des-brumes');
  await page.getByRole('link', { name: 'Commencer la lecture' }).click();
  await expect(page).toHaveURL(/\/lire\/le-phare-des-brumes/);

  const heading = page.getByRole('heading', { level: 1 });
  const first = await heading.textContent();
  await page.keyboard.press('1');
  await expect(heading).not.toHaveText(first ?? '');

  // La progression est gardée localement : un rechargement reprend la partie.
  const second = await heading.textContent();
  await page.reload();
  await expect(heading).toHaveText(second ?? '');
});
