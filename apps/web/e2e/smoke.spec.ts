import { expect, test } from '@playwright/test';

test('home page renders the scaffold shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /scaffold is ready/i })).toBeVisible();
});
