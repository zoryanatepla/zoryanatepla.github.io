import { test, expect } from './fixtures'
import AxeBuilder from '@axe-core/playwright'

const paths = [
  '',
  'poslugy/brekety/',
  'poslugy/elainery/',
  'poslugy/dytiacha-ortodontiia/',
  'poslugy/hnatolohiia/',
  'vash-shliakh-do-posmishky/',
  'polityka-konfidentsiinosti/',
]

test('clinic details, map destination, experience and requested removals', async ({ page }) => {
  await page.goto('/')
  const contacts = page.locator('#contacts')
  await expect(contacts.locator('.clinic-address')).toHaveText(
    'вулиця Юлії Здановської, 58А, Київ, 03191',
  )
  await expect(contacts).toContainText('Прийом у клініці Лукашука.')
  await expect(page.locator('footer .footer-visit-note')).toContainText('Прийом у клініці Лукашука')
  await expect(page.locator('.experience-number')).toContainText('20+')
  await expect(page.locator('.trust-number')).toHaveText('20+')
  const map = contacts.locator('iframe')
  const src = new URL((await map.getAttribute('src'))!)
  expect(src.origin).toBe('https://www.google.com')
  expect(src.searchParams.get('q')).toBe('вулиця Юлії Здановської, 58А, Київ, 03191')
  expect(src.searchParams.get('output')).toBe('embed')
  expect(
    new URL(
      (await contacts.getByRole('link', { name: 'Відкрити Google Maps' }).getAttribute('href'))!,
    ).searchParams.get('query'),
  ).toBe(src.searchParams.get('q'))
  const structured = await page.locator('script[type="application/ld+json"]').textContent()
  expect(JSON.parse(structured!).address.postalCode).toBe('03191')
  for (const selector of [
    '.hero-location',
    '.hero-scroll',
    '.appointment-phone',
    '#appointment .appointment-copy > p',
    '.map-placeholder',
    '#comment-help',
  ])
    await expect(page.locator(selector)).toHaveCount(0)
  await expect(page.locator('#comment')).not.toHaveAttribute('placeholder')
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(
      await contacts
        .locator('.map-caption > a')
        .evaluate(
          (el) =>
            el.getBoundingClientRect().bottom <=
            el.closest('.map-card')!.getBoundingClientRect().bottom,
        ),
    ).toBe(true)
  }
  await expect(contacts).not.toContainText('Графік прийому')
  await expect(contacts).not.toContainText('Більше знайомства в Instagram')
  await expect(page.locator('body')).not.toContainText('24 роки')
})

test('English routes, metadata and navigation remain in English after direct entry and reload', async ({
  page,
  request,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  for (const path of paths) {
    const url = `/en/${path}`
    const html = await (await request.get(url)).text()
    expect(html).toContain('lang="en"')
    expect(html).toContain('Zoryana Tepla')
    expect(html).not.toContain('<!--app-->')
    await page.goto(url)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://zoryanatepla.github.io${url}`,
    )
    await expect(page.locator('link[hreflang="uk"]')).toHaveAttribute(
      'href',
      `https://zoryanatepla.github.io/${path}`,
    )
    expect(await page.locator('main').innerText()).not.toMatch(/[А-Яа-яІіЇїЄєҐґ]{3,}/)
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  }
  await page.goto('/#services')
  await page.getByRole('link', { name: 'EN — English', exact: true }).click()
  await expect(page).toHaveURL(/\/en\/#services$/)
  await expect(page.locator('#services')).toBeInViewport()
  await page.locator('.service-card').first().click()
  await expect(page).toHaveURL(/\/en\/poslugy\/brekety\/$/)
  await expect(page.locator('h1')).toHaveText('Braces')
  await page.getByRole('link', { name: 'UA — Українська', exact: true }).click()
  await expect(page).toHaveURL(/\/poslugy\/brekety\/$/)
  await expect(page.locator('h1')).toHaveText('Брекет-системи')
  await page.getByRole('link', { name: 'EN — English', exact: true }).click()
  await page.getByRole('link', { name: 'Book a consultation', exact: true }).first().click()
  await expect(page).toHaveURL(/\/en\/#appointment$/)
  await page.getByRole('button', { name: 'Send request', exact: true }).click()
  await expect(page.locator('#error-name')).toHaveText('Enter a name between 2 and 80 characters.')
  await page.getByLabel('Your name').fill('Test Patient')
  await page.getByLabel('Phone number').fill('+380670000000')
  await page.getByLabel('Reason for your visit').selectOption({ label: 'First consultation' })
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Send request', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Receipt of your request could not be confirmed',
  )
  expect(errors).toEqual([])
})

test('system theme, explicit preference, reload and new tabs preserve theme without losing form entries', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto('/en/#appointment')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByLabel('Your name').fill('Theme Test')
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.getByLabel('Your name')).toHaveValue('Theme Test')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  const tab = await context.newPage()
  await tab.goto('/en/poslugy/elainery/')
  await expect(tab.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await tab.evaluate(() => localStorage.getItem('tepla-theme'))).toBe('dark')
  expect(await tab.evaluate(() => Object.values(localStorage).join(' '))).not.toContain(
    'Theme Test',
  )
  await tab.close()
})

test('both languages remain readable without JavaScript and when preference storage is blocked', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  for (const lang of ['', 'en/']) {
    await page.goto(`http://127.0.0.1:4176/${lang}vash-shliakh-do-posmishky/`)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.journey-panel')).toHaveCount(6)
    await expect(page.locator('html')).toHaveAttribute('lang', lang ? 'en' : 'uk')
  }
  await context.close()
  const isolated = await browser.newContext({ colorScheme: 'dark' })
  await isolated.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Disabled', 'SecurityError')
      },
    })
  })
  const p = await isolated.newPage()
  await p.goto('http://127.0.0.1:4176/en/')
  await p.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(p.locator('html')).toHaveAttribute('data-theme', 'light')
  await isolated.close()
})

test('dark theme and English layouts meet automated WCAG AA checks at mobile and desktop sizes', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const path of paths) {
      await page.goto(`/en/${path}`)
      await expect(page.locator('h1')).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} ${width}`,
      ).toBe(true)
    }
  }
  for (const [path, width] of [
    ['', 1440],
    ['en/', 390],
    ['en/#appointment', 390],
    ['en/vash-shliakh-do-posmishky/', 1440],
    ['en/poslugy/brekety/', 1440],
    ['en/polityka-konfidentsiinosti/', 390],
  ] as const) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(`/${path}`)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
      .analyze()
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([])
  }
})

test('mobile navigation is accessible in both languages and both themes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  for (const language of ['', 'en/']) {
    await page.goto(`/${language}`)
    await page.locator('.menu-toggle').click()
    for (const theme of ['light', 'dark']) {
      if ((await page.locator('html').getAttribute('data-theme')) !== theme)
        await page.locator('.theme-toggle').click()
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(
        result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
      ).toEqual([])
    }
  }
})
