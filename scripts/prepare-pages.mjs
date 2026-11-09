import fs from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

// Fail before touching the live root if a build is incomplete or still points
// at a source-only entrypoint (the cause of the initial blank publication).
execFileSync(process.execPath, ['scripts/verify-static.mjs'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_BASE_PATH: '/dentist/',
    VITE_SITE_URL: 'https://zoryanatepla.github.io',
  },
})

// Pages is already configured to serve main/(root). Keep editable application
// sources in src/ and copy only the verified public build into the publishing root.
const allowed = new Set([
  'index.html',
  '404.html',
  '.nojekyll',
  'favicon.svg',
  'favicon.ico',
  'favicon-zt.png',
  'favicon-zt-512.png',
  'apple-touch-icon.png',
  'robots.txt',
  'sitemap.xml',
  'googlec1003d020b97f89b.html',
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
// Restore the previous release at its original project path inside the renamed repository.
const publishRoot = 'dentist'
await fs.mkdir(publishRoot, { recursive: true })
await fs.cp('assets', `${publishRoot}/assets`, { recursive: true, force: true })
for (const entry of entries) {
  await fs.cp(`dist/${entry}`, `${publishRoot}/${entry}`, { recursive: true, force: true })
}
// Google may verify either the account origin or the /dentist/ URL-prefix property.
await fs.copyFile('dist/googlec1003d020b97f89b.html', 'googlec1003d020b97f89b.html')
// Root-level fallbacks also serve the redirect homepage, search crawlers and older browsers.
for (const icon of [
  'favicon.ico',
  'favicon-zt.png',
  'favicon-zt-512.png',
  'apple-touch-icon.png',
]) {
  await fs.copyFile(`dist/${icon}`, icon)
}
function redirectHtml(destination) {
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Зоряна Тепла — сайт</title><link rel="icon" type="image/png" sizes="96x96" href="/favicon-zt.png?v=zt1"><link rel="shortcut icon" href="/favicon.ico?v=zt1"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=zt1"><meta http-equiv="refresh" content="0;url=${destination}"><link rel="canonical" href="https://zoryanatepla.github.io${destination}"></head><body><a href="${destination}">Відкрити сайт Зоряни Теплої</a><script>location.replace(${JSON.stringify(destination)} + location.search + location.hash)</script></body></html>`
}
await fs.writeFile('index.html', redirectHtml('/dentist/'))
// Return an actual non-indexable error page instead of redirecting missing URLs to home.
await fs.writeFile(
  '404.html',
  `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, follow"><title>Сторінку не знайдено — Зоряна Тепла</title><link rel="icon" href="/favicon.ico?v=zt1"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f8f5ee;color:#22342d;font:18px/1.7 system-ui,sans-serif}main{padding:32px;max-width:560px}h1{font-size:clamp(28px,6vw,44px);line-height:1.2}a{color:#285e49}a:focus-visible{outline:2px solid #285e49;outline-offset:5px}</style></head><body><main><p>404 · Зоряна Тепла</p><h1>Сторінку не знайдено</h1><p>Перевірте адресу або поверніться на сайт лікаря.</p><a href="/dentist/">Перейти на головну</a></main></body></html>`,
)
for (const entry of [
  'poslugy',
  'polityka-konfidentsiinosti',
  'vash-shliakh-do-posmishky',
  'mentorstvo',
  'do-pislia',
  'en',
]) {
  async function redirectDirectory(directory) {
    for (const item of await fs.readdir(directory, { withFileTypes: true })) {
      const name = `${directory}/${item.name}`
      if (item.isDirectory()) await redirectDirectory(name)
      else if (item.name === 'index.html')
        await fs.writeFile(name, redirectHtml(`/dentist/${directory}/`))
    }
  }
  await redirectDirectory(entry)
}
await fs.writeFile(
  'robots.txt',
  'User-agent: *\nAllow: /\nSitemap: https://zoryanatepla.github.io/dentist/sitemap.xml\n',
)
await fs.copyFile('dentist/sitemap.xml', 'sitemap.xml')
console.log('Restored the complete site under /dentist/; the account root forwards there.')
execFileSync(
  process.execPath,
  [new URL('./verify-static.mjs', import.meta.url).pathname, '--published'],
  {
    cwd: publishRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_BASE_PATH: '/dentist/',
      VITE_SITE_URL: 'https://zoryanatepla.github.io',
    },
  },
)
