import { test, expect } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL;
const PASS  = process.env.E2E_PASSWORD;

test('guest sees community feed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Workout Tracker')).toBeVisible();
});

test.skip(!EMAIL || !PASS, 'set E2E_EMAIL/PASSWORD to run auth flow');

test('member can sign in and create a session', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.fill('input[type="email"]', EMAIL!);
  await page.fill('input[type="password"]', PASS!);
  await page.getByRole('button', { name: /^sign in$/i }).first().click();

  await expect(page.getByRole('button', { name: /new session/i })).toBeVisible();
  await page.getByRole('button', { name: /new session/i }).click();
  await page.fill('input[placeholder="Session name"]', 'PPL Test Session');
  await page.getByRole('button', { name: /^create$/i }).click();
  await expect(page.getByText('PPL Test Session')).toBeVisible();
});
