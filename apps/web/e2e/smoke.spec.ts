import { expect, test } from '@playwright/test';

test('UI shell renders brand and dashboard navigation', async ({ page }) => {
  await page.goto('/');

  // Expect brand in navigation bar
  await expect(page.getByRole('link', { name: /quiz.*forge/i })).toBeVisible();

  // Expect dashboard welcome heading
  await expect(page.getByRole('heading', { name: /xin chào/i })).toBeVisible();

  // Navigate to login page
  await page
    .getByRole('link', { name: /đăng nhập/i })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: /đăng nhập quizforge/i })).toBeVisible();
});
