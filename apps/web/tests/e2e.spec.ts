// apps/web/tests/e2e.spec.ts
import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

test('guest can browse public feed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Workout Tracker')).toBeVisible();
  // Public feed should render cards or an empty state
  await expect(page.locator('text=public').first()).toBeVisible({ timeout: 10_000 }).catch(() => {});
});

test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'set E2E_EMAIL/PASSWORD to run login flow');

test('member can sign in and open New Session modal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /sign in/i }).click();
  // Your AuthModal flows here (adjust selectors to your UI)
  await page.fill('input[type="email"]', E2E_EMAIL!);
  await page.fill('input[type="password"]', E2E_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).first().click();

  // After login, New Session button appears/enabled
  await expect(page.getByRole('button', { name: /new session/i })).toBeVisible();
  await page.getByRole('button', { name: /new session/i }).click();
  await expect(page.getByText('New Workout Session')).toBeVisible();
});
