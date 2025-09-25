import { defineConfig, devices } from '@playwright/test';

// Centralized E2E config.
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  timeout: 60_000,
});