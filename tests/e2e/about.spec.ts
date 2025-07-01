import { test, expect } from '@playwright/test';

test('about page has correct heading', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('h1')).toHaveText('About Page');
});
