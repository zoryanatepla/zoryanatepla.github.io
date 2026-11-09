import fs from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

// Fail before touching the live root if a build is incomplete or still points
// at a source-only entrypoint (the cause of the initial blank publication).
execFileSync(process.execPath, ['scripts/verify-static.mjs'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_BASE_PATH: '/dentist/',
    VITE_SITE_URL: 'https://formalandscape.github.io',
  },
})

// Pages is already configured to serve main/(root). Keep editable application
// sources in src/ and copy only the verified public build into the publishing root.
const allowed = new Set([
  'index.html',
  '404.html',
  '.nojekyll',
  'favicon.svg',
  'robots.txt',
  'sitemap.xml',
  'assets',
  'images',
  'poslugy',
  'polityka-konfidentsiinosti',
  'vash-shliakh-do-posmishky',
  'mentorstvo',
  'do-pislia',
  'en',
])
const entries = await fs.readdir('dist')
if (!entries.includes('sitemap.xml') || !entries.includes('.nojekyll')) {
  throw new Error('Run npm run build:pages before preparing the public root.')
}
for (const entry of entries) {
  if (!allowed.has(entry)) throw new Error(`Unexpected build output: ${entry}`)
}
for (const entry of entries) {
  // Keep old hashed JS/CSS for cached HTML and tabs opened before a release.
  if (
    [
      'images',
      'poslugy',
      'polityka-konfidentsiinosti',
      'vash-shliakh-do-posmishky',
      'mentorstvo',
      'do-pislia',
      'en',
    ].includes(entry)
  ) {
    await fs.rm(entry, { recursive: true, force: true })
  }
  await fs.cp(`dist/${entry}`, entry, { recursive: true, force: true })
}
console.log('Prepared verified GitHub Pages files in main/(root). Editable HTML: src/index.html.')
execFileSync(process.execPath, ['scripts/verify-static.mjs', '--published'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_BASE_PATH: '/dentist/',
    VITE_SITE_URL: 'https://formalandscape.github.io',
  },
})
