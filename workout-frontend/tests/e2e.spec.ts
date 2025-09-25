import { test, expect } from '@playwright/test';

// E2E credentials are provided via env for safety
const EMAIL = process.env.E2E_EMAIL;
const PASS  = process.env.E2E_PASSWORD;

// Smoke test: anonymous user can load the app shell.
test('guest sees community feed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Workout Tracker')).toBeVisible();
});

// Skip auth tests when creds aren't configured.
// This keeps "npm test" green for contributors without secrets.
test.skip(!EMAIL || !PASS, 'set E2E_EMAIL/PASSWORD to run auth flow');

// Happy-path auth + create session flow.
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
  
  // Minimal assertion to prove session creation surfaced in the UI.
  await expect(page.getByText('PPL Test Session')).toBeVisible();
});