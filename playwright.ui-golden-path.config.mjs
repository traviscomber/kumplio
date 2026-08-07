import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'https://www.kumplio.app'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /ui-golden-path\.spec\.mjs/,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 35 * 60 * 1000,
  expect: { timeout: 30_000 },
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report/ui-golden-path', open: 'never' }],
    ['json', { outputFile: 'test-results/ui-golden-path.json' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
    colorScheme: 'light',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 45_000,
    actionTimeout: 30_000,
  },
})
