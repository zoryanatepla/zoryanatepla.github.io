import brand from '../src/data/brand.json' with { type: 'json' }
import fs from 'node:fs/promises'
import { createServer, loadEnv } from 'vite'

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env }
const base = env.VITE_BASE_PATH || '/'
if (!base.startsWith('/') || !base.endsWith('/'))
  throw new Error('VITE_BASE_PATH must start and end with /')
if (
  env.VITE_SITE_URL &&
  (!/^https:\/\//.test(env.VITE_SITE_URL) ||
    new URL(env.VITE_SITE_URL).origin !== env.VITE_SITE_URL.replace(/\/$/, ''))
)
  throw new Error('VITE_SITE_URL must be an HTTPS origin, without a path')
const origin = env.VITE_SITE_URL?.replace(/\/$/, '')
const canonical = (path) => (origin ? `${origin}${base}${path.replace(/^\//, '')}` : undefined)
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  mode: 'production',
})
const escape = (s) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
try {
  const {
    render,
    seoForPath,
    schemaForPath,
    services,
    servicePath,
    journeyPath,
    localizedPath,
    languageForPath,
  } = await vite.ssrLoadModule('/entry-server.tsx')
  const template = await fs.readFile('dist/index.html', 'utf8')
  const assetNames = await fs.readdir('dist/assets')
  const criticalFonts = (language) =>
    [
      `manrope-${language === 'en' ? 'latin' : 'cyrillic'}-400-normal-`,
      `cormorant-garamond-${language === 'en' ? 'latin' : 'cyrillic'}-400-normal-`,
      `cormorant-garamond-${language === 'en' ? 'latin' : 'cyrillic'}-400-italic-`,
    ]
      .map((prefix) =>
        assetNames.find((name) => name.startsWith(prefix) && name.endsWith('.woff2')),
      )
      .filter(Boolean)
  const ukrainianPaths = [
    '/',
    ...services.map((s) => servicePath(s.id)),
    journeyPath,
    '/mentorstvo/',
    '/do-pislia/',
    '/polityka-konfidentsiinosti/',
  ]
  const paths = [...ukrainianPaths, ...ukrainianPaths.map((path) => localizedPath(path, 'en'))]
  for (const path of [...paths, '/404/', '/en/404/']) {
    const language = languageForPath(path)
    const seo = seoForPath(path)
    const url = canonical(seo.path)
    const metadata = [
      ...criticalFonts(language).map(
        (font) =>
          `<link rel="preload" href="${base}assets/${font}" as="font" type="font/woff2" crossorigin />`,
      ),
      '<meta property="og:type" content="website" />',
      `<meta property="og:locale" content="${language === 'en' ? 'en_GB' : 'uk_UA'}" />`,
      `<meta property="og:site_name" content="${escape(language === 'en' ? brand.nameEn : brand.name)}" />`,
      `<meta property="og:title" content="${escape(seo.title)}" />`,
      `<meta property="og:description" content="${escape(seo.description)}" />`,
      `<meta name="robots" content="${seo.noindex ? 'noindex, follow' : 'index, follow'}" />`,
      ...(url
        ? [
            `<link rel="canonical" href="${escape(url)}" />`,
            ...(!seo.noindex
              ? ['uk', 'en', 'x-default'].map(
                  (locale) =>
                    `<link rel="alternate" hreflang="${locale}" href="${escape(canonical(localizedPath(path, locale === 'en' ? 'en' : 'uk')))}" />`,
                )
              : []),
            `<meta property="og:url" content="${escape(url)}" />`,
            `<meta property="og:image" content="${escape(canonical('/images/social-card.png'))}" />`,
            '<meta property="og:image:width" content="1200" />',
            '<meta property="og:image:height" content="630" />',
            `<meta property="og:image:alt" content="${language === 'en' ? 'Zoryana Tepla — orthodontist in Kyiv' : 'Зоряна Тепла — лікар стоматолог-ортодонт у Києві'}" />`,
          ]
        : []),
      ...(env.VITE_GOOGLE_SITE_VERIFICATION
        ? [
            `<meta name="google-site-verification" content="${escape(env.VITE_GOOGLE_SITE_VERIFICATION)}" />`,
          ]
        : []),
      ...(!seo.noindex
        ? [
            `<script type="application/ld+json">${JSON.stringify({ ...schemaForPath(path), ...(url ? { url } : {}) }).replaceAll('<', '\\u003c')}</script>`,
          ]
        : []),
    ].join('\n    ')
    const html = template
      .replace('lang="uk"', `lang="${language}"`)
      .replace(/<title>.*?<\/title>/, `<title>${escape(seo.title)}</title>`)
      .replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${escape(seo.description)}" />`,
      )
      .replace('<!--seo-->', metadata)
      .replace('<div id="root">', `<div id="root" data-page="${escape(path)}">`)
      .replace('<!--app-->', render(path))
    const file = path === '/404/' ? 'dist/404.html' : `dist${path}index.html`
    await fs.mkdir(file.substring(0, file.lastIndexOf('/')), { recursive: true })
    await fs.writeFile(file, html)
  }
  await fs.writeFile(
    'dist/robots.txt',
    `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${origin}${base}sitemap.xml\n` : ''}`,
  )
  if (origin)
    await fs.writeFile(
      'dist/sitemap.xml',
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${paths.map((path) => `<url><loc>${escape(canonical(path))}</loc>${['uk', 'en', 'x-default'].map((locale) => `<xhtml:link rel="alternate" hreflang="${locale}" href="${escape(canonical(localizedPath(path, locale === 'en' ? 'en' : 'uk')))}" />`).join('')}</url>`).join('')}</urlset>`,
    )
  else
    console.warn(
      'VITE_SITE_URL is not set: canonical, absolute Open Graph URLs and sitemap await the real public domain.',
    )
  console.log(`Prerendered ${paths.length} pages + Ukrainian/English 404. Base: ${base}`)
} finally {
  await vite.close()
}
