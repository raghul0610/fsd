import { test, expect } from '@playwright/test';

test('offline shell remains usable after an online warm-up', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByText('Healthcare, even when offline.')).toBeVisible();

  // Allow the service worker to install and cache the application shell/assets.
  await page.reload();
  await expect(page.getByText('Healthcare, even when offline.')).toBeVisible();

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByText('Healthcare, even when offline.')).toBeVisible();
  await expect(page.getByText('OFFLINE')).toBeVisible();
});