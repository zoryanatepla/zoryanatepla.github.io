import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { loadEnv } from 'vite'

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env }
const base = env.VITE_BASE_PATH || '/'
const folder = process.argv.includes('--published') ? '.' : 'dist'
const origin = env.VITE_SITE_URL?.replace(/\/$/, '')
const ukrainianPaths = [
  '/',
  '/poslugy/brekety/',
  '/poslugy/elainery/',
  '/poslugy/dytiacha-ortodontiia/',
  '/poslugy/hnatolohiia/',
  '/vash-shliakh-do-posmishky/',
  '/mentorstvo/',
  '/do-pislia/',
  '/polityka-konfidentsiinosti/',
]
const paths = [...ukrainianPaths, ...ukrainianPaths.map((path) => `/en${path}`)]
const descriptions = new Set()
const titles = new Set()
for (const path of paths) {
  const html = await fs.readFile(`${folder}${path}index.html`, 'utf8')
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${path}: exactly one h1`)
  assert.ok(
    !html.includes('<!--app-->') && html.includes('<main '),
    `${path}: actual prerendered content`,
  )
  assert.ok(!html.includes('%BASE_URL%'), `${path}: no unresolved Vite placeholders`)
  const resources = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1])
  assert.ok(
    resources.some((url) => url.endsWith('.js')),
    `${path}: a compiled script is present`,
  )
  for (const url of resources) {
    assert.ok(url.startsWith(`${base}assets/`), `${path}: compiled assets only`)
    assert.ok(
      !url.endsWith('.tsx') && !url.endsWith('.ts'),
      `${path}: never publish TypeScript entries`,
    )
    await fs.access(`${folder}/${url.slice(base.length)}`)
  }
  assert.ok(
    !/<script[^>]+src="[^"]+\.(?:tsx?|jsx)"/.test(html),
    `${path}: no source-only entrypoint`,
  )

  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/)?.[1]
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
  assert.ok(description && !descriptions.has(description), `${path}: unique description`)
  assert.ok(title && !titles.has(title), `${path}: unique title`)
  descriptions.add(description)
  titles.add(title)
  assert.ok(
    html.includes(`lang="${path.startsWith('/en/') ? 'en' : 'uk'}"`),
    `${path}: correct document language`,
  )
  assert.ok(!/24 (?:роки|років)/.test(html), `${path}: current experience claim`)
  assert.ok(html.includes(`src="${base}assets/`), `${path}: script respects base path`)
  assert.ok(html.includes(`href="${base}favicon.svg"`), `${path}: favicon respects base path`)
  if (origin) {
    assert.ok(html.includes(`rel="canonical" href="${origin}${base}${path.slice(1)}"`))
    const clean = path.replace(/^\/en(?=\/|$)/, '')
    for (const locale of ['uk', 'en', 'x-default']) {
      const alternative = locale === 'en' ? `/en${clean}` : clean
      assert.ok(
        html.includes(`hreflang="${locale}" href="${origin}${base}${alternative.slice(1)}"`),
        `${path}: ${locale} alternate`,
      )
    }
    assert.ok(html.includes(`property="og:image" content="${origin}${base}images/social-card.png"`))
  } else assert.ok(!html.includes('rel="canonical"'), 'No invented canonical domain')
}
const mentoring = await fs.readFile(`${folder}/mentorstvo/index.html`, 'utf8')
assert.ok(mentoring.includes('id="mentorship-about"'), 'Mentorship about section is static')
assert.ok(mentoring.includes('id="mentorship-request"'), 'Mentorship enquiry is static')
assert.ok(
  mentoring.includes('проведення програм чи навчальних курсів наразі не заявлено'),
  'No unconfirmed training claims',
)
assert.ok(
  mentoring.includes('href="https://www.instagram.com/dr.zoryana.tepla"'),
  'Mentorship uses the existing contact',
)
const journey = await fs.readFile(`${folder}/vash-shliakh-do-posmishky/index.html`, 'utf8')
assert.ok(!journey.includes('Ви не зобов’язані знати'), 'Requested journey text removed')
const home = await fs.readFile(`${folder}/index.html`, 'utf8')
assert.ok(home.includes('"@type":"Physician"'))
assert.ok(home.includes('tel:+380679404225'))
assert.ok(home.includes('Юлії Здановської'))
assert.ok(home.includes('Клініка Лукашука'))
assert.ok(home.includes('https://www.google.com/maps?q='))
assert.ok(home.includes('20+'))
assert.ok(
  (await fs.readFile(`${folder}/images/social-card.svg`, 'utf8')).includes('20+ років досвіду'),
  'Current experience in social preview',
)
assert.ok(home.includes(`href="${base}poslugy/brekety/"`), 'Prerendered links respect base path')
assert.ok(
  home.includes(`href="${base}#appointment"`),
  'Root anchors retain the base trailing slash',
)
assert.ok((await fs.readFile(`${folder}/404.html`, 'utf8')).includes('noindex, follow'))
const cssFiles = (await fs.readdir(`${folder}/assets`)).filter((f) => f.endsWith('.css'))
const css = (
  await Promise.all(cssFiles.map((f) => fs.readFile(`${folder}/assets/${f}`, 'utf8')))
).join('')
assert.ok(css.includes(`${base}images/editorial-still-life.webp`), 'Photo respects base path')
const robots = await fs.readFile(`${folder}/robots.txt`, 'utf8')
if (origin) {
  assert.ok(robots.includes(`Sitemap: ${origin}${base}sitemap.xml`))
  const sitemap = await fs.readFile(`${folder}/sitemap.xml`, 'utf8')
  for (const path of paths)
    assert.ok(sitemap.includes(`<loc>${origin}${base}${path.slice(1)}</loc>`))
} else {
  assert.ok(!robots.includes('Sitemap:'))
  await assert.rejects(fs.access(`${folder}/sitemap.xml`))
}
// Never publish the new gallery with missing clinical originals.
for (let index = 1; index <= 8; index++) {
  const file = `${folder}/images/results/${String(index).padStart(2, '0')}.webp`
  await fs.access(file).catch(() => {
    throw new Error(
      `Missing original treatment photo: ${file}. Supply the eight original files before publication.`,
    )
  })
}

console.log(
  `Static checks passed: 18 pages, UK/EN languages, hreflang, clinic address, SEO, schema, 404, assets, robots${origin ? ', canonical, sitemap' : ' (domain pending)'}. Base: ${base}`,
)
