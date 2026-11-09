import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: ['site.spec.ts', 'results.spec.ts'],
  fullyParallel: true,
  workers: 2,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox'],
    },
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'VITE_FORMSPREE_ENDPOINT= npm run dev -- --port 4175 --strictPort',
      port: 4175,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run preview -- --port 4173 --strictPort',
      port: 4173,
      reuseExistingServer: !process.env.CI,
    },
    {
      command:
        'VITE_FORMSPREE_ENDPOINT=https://formspree.io/f/testform npm run dev -- --port 4174 --strictPort',
      port: 4174,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
