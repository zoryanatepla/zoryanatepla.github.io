import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: [
    'pages.spec.ts',
    'motion.spec.ts',
    'preferences.spec.ts',
    'premium.spec.ts',
    'results.spec.ts',
  ],
  metadata: { siteBase: '/dentist' },
  workers: 2,
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4176',
    reducedMotion: 'no-preference',
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox'],
    },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node tests/static-server.mjs',
    url: 'http://127.0.0.1:4176/dentist/',
    reuseExistingServer: !process.env.CI,
  },
})
