import { test, expect } from './fixtures'

const origin = 'https://zoryanatepla.github.io'
const base = '/dentist/'
const slugs = ['brekety', 'elainery', 'dytiacha-ortodontiia', 'hnatolohiia']

function readSchema(html: string) {
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]
  expect(json, 'A crawler must receive structured data in the initial HTML').toBeTruthy()
  return JSON.parse(json!)
}

test('UK and EN service pages expose concise local descriptions and a consistent doctor identity without JavaScript', async ({
  request,
}) => {
  for (const language of ['', 'en/']) {
    const home = readSchema(await (await request.get(`${base}${language}`)).text())
    expect(home['@type']).toBe('Physician')
    expect(home['@id']).toBe(`${origin}${base}#doctor`)
    expect(home.telephone).toBe('+380679404225')
    expect(home.email).toBe('orthodentua@gmail.com')
    expect(home.address.postalCode).toBe('03191')
    expect(home.image).toBe(`${origin}${base}images/zoryana-tepla-hero.webp`)
    expect(home.logo).toBe(`${origin}${base}favicon-zt-512.png`)
    expect(home.aggregateRating).toBeUndefined()
    expect(home.openingHours).toBeUndefined()
    for (const slug of slugs) {
      const path = `${base}${language}poslugy/${slug}/`
      const response = await request.get(path)
      expect(response.status()).toBe(200)
      const html = await response.text()
      const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/)?.[1]
      expect(description!.length).toBeGreaterThan(80)
      expect(description!.length).toBeLessThanOrEqual(180)
      expect(description).toContain(language ? 'Kyiv' : 'Києві')
      const structured = readSchema(html)
      expect(structured['@type']).toBe('Service')
      expect(structured.url).toBe(origin + path)
      expect(structured.provider['@id']).toBe(home['@id'])
      expect(structured.provider.address).toEqual(home.address)
      const page = structured.mainEntityOfPage
      expect(page.inLanguage).toBe(language ? 'en' : 'uk')
      expect(page.description).toBe(description)
      expect(page.breadcrumb.itemListElement.map((item: { item: string }) => item.item)).toEqual([
        `${origin}${base}${language}`,
        origin + path,
      ])
      expect(page.isPartOf.publisher['@id']).toBe(home['@id'])
      expect(structured.offers).toBeUndefined()
    }
    for (const url of [home.image, home.logo]) {
      expect((await request.get(new URL(url).pathname)).status()).toBe(200)
    }
  }
})

test('sitemap contains only current canonical pages and reciprocal language alternatives', async ({
  page,
  request,
}) => {
  await page.goto(base)
  const response = await request.get(`${base}sitemap.xml`)
  expect(response.status()).toBe(200)
  const entries = await page.evaluate(
    (xml) => {
      const document = new DOMParser().parseFromString(xml, 'application/xml')
      if (document.querySelector('parsererror')) throw new Error('Invalid sitemap XML')
      return [...document.getElementsByTagName('url')].map((url) => ({
        loc: url.getElementsByTagName('loc')[0].textContent!,
        alternates: [...url.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link')].map(
          (link) => ({ language: link.getAttribute('hreflang'), href: link.getAttribute('href') }),
        ),
      }))
    },
    await response.text(),
  )
  expect(entries).toHaveLength(18)
  const urls = entries.map((entry) => entry.loc)
  expect(new Set(urls).size).toBe(18)
  for (const entry of entries) {
    expect(entry.loc.startsWith(origin + base)).toBe(true)
    expect(entry.loc.endsWith('/')).toBe(true)
    expect(entry.loc).not.toContain('404')
    expect(entry.alternates.map((link) => link.language)).toEqual(['uk', 'en', 'x-default'])
    for (const link of entry.alternates) {
      expect(urls).toContain(link.href)
      const target = entries.find((other) => other.loc === link.href)!
      expect(target.alternates.map((item) => item.href)).toContain(entry.loc)
    }
  }
  for (const path of ['/robots.txt', `${base}robots.txt`]) {
    expect(await (await request.get(path)).text()).toContain(`Sitemap: ${origin}${base}sitemap.xml`)
  }
  expect(await (await request.get(`${base}googlec1003d020b97f89b.html`)).text()).toBe(
    'google-site-verification: googlec1003d020b97f89b.html',
  )
})

test('client navigation keeps structured data aligned with the selected page', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(base)
  const structured = page.locator('script[type="application/ld+json"]')
  await page.locator('.service-card').first().click()
  await expect(page.locator('h1')).toHaveText('Брекет-системи')
  await expect
    .poll(async () => JSON.parse((await structured.textContent())!)['@type'])
    .toBe('Service')
  const service = JSON.parse((await structured.textContent())!)
  expect(service.url).toBe(origin + base + 'poslugy/brekety/')
  await page.getByRole('link', { name: 'Усі напрями лікування' }).click()
  await expect
    .poll(async () => JSON.parse((await structured.textContent())!)['@type'])
    .toBe('Physician')
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(origin + base)
})

test('missing published URLs return a non-indexable 404 without redirecting to home', async ({
  page,
  request,
}) => {
  const path = base + 'seo-check-missing-page/'
  const response = await request.get(path)
  expect(response.status()).toBe(404)
  const html = await response.text()
  expect(html).toContain('noindex, follow')
  expect(html).not.toContain('http-equiv="refresh"')
  expect(html).not.toContain('location.replace')
  await page.goto(path)
  await expect(page).toHaveURL(new RegExp('seo-check-missing-page/$'))
  await expect(page.locator('h1')).toHaveText('Сторінку не знайдено')
  await expect(page.getByRole('link', { name: 'Перейти на головну' })).toHaveAttribute('href', base)
})
