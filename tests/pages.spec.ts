import { test, expect } from './fixtures'
import AxeBuilder from '@axe-core/playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

test('cold entry, reload, slash redirect and new tabs work on the actual published tree', async ({
  page,
  context,
}) => {
  const errors: string[] = []
  context.on('page', (p) => p.on('pageerror', (e) => errors.push(e.message)))
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })
  const paths = [
    '',
    'poslugy/brekety/',
    'poslugy/elainery/',
    'poslugy/dytiacha-ortodontiia/',
    'poslugy/hnatolohiia/',
    'vash-shliakh-do-posmishky/',
    'polityka-konfidentsiinosti/',
  ]
  for (const path of paths) {
    const response = await page.goto(`/dentist/${path}`)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toBeVisible()
    if (!path.startsWith('polityka')) await expect(page.locator('#name')).toBeEnabled()
    await page.reload()
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://zoryanatepla.github.io/dentist/${path}`,
    )
  }
  await page.goto('/dentist/vash-shliakh-do-posmishky')
  await expect(page).toHaveURL(/vash-shliakh-do-posmishky\/$/)
  const tab = await context.newPage()
  await tab.goto('/dentist/vash-shliakh-do-posmishky/')
  await expect(tab.locator('h1')).toBeVisible()
  await tab.close()
  expect(errors).toEqual([])
})

test('journey supports all six steps, keyboard navigation and progress', async ({ page }) => {
  await page.goto('/dentist/vash-shliakh-do-posmishky/')
  const tabs = page.getByRole('tab')
  const portrait = page.locator('.journey-art .doctor-portrait')
  await expect(portrait).toHaveAttribute('src', '/dentist/images/zoryana-tepla-journey.webp')
  await expect
    .poll(() => portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true)
  await expect(page.locator('.journey-tab-number, .journey-art-caption > span')).toHaveCount(0)
  expect(await page.locator('.journey-progress-row').innerText()).not.toMatch(/\d/)
  for (const tab of await tabs.all()) expect(await tab.innerText()).not.toMatch(/\d/)
  await expect(tabs).toHaveCount(6)
  for (let i = 0; i < 6; i++) {
    await tabs.nth(i).click()
    await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator(`#journey-panel-${i}`)).toBeVisible()
    expect(await page.locator(`#journey-panel-${i} > .tiny-caps`).innerText()).not.toMatch(/\d/)
    await expect(page.getByRole('progressbar')).toHaveAttribute('value', `${i + 1}`)
  }
  await tabs.last().press('Home')
  await expect(tabs.first()).toBeFocused()
  await tabs.first().press('ArrowDown')
  await expect(tabs.nth(1)).toBeFocused()
  await tabs.nth(1).press('End')
  await expect(tabs.last()).toBeFocused()
  await page.getByRole('link', { name: 'Обговорити мій шлях' }).click()
  await expect(page).toHaveURL(/\/dentist\/#appointment$/)
  await expect(page.locator('#appointment')).toBeInViewport()
  await page.reload()
  await expect(page).toHaveURL(/\/dentist\/$/)
  await expect(page.locator('.hero h1')).toBeInViewport()
  expect(await page.evaluate(() => scrollY)).toBeLessThan(3)
})

test('no JavaScript or a failed script never produces an empty document', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  for (const path of ['', 'vash-shliakh-do-posmishky/']) {
    await page.goto(`http://127.0.0.1:4176/dentist/${path}`)
    await expect(page.locator('h1')).toBeVisible()
    expect(await page.locator('#root').innerText()).toContain('Зоряна Тепла')
  }
  await context.close()
  const p = await browser.newPage()
  await p.route('**/assets/*.js', (r) => r.abort())
  await p.goto('http://127.0.0.1:4176/dentist/')
  await expect(p.locator('h1')).toBeVisible()
  await expect(p.locator('#root')).not.toBeEmpty()
  await p.close()
})

test('cached HTML from the preceding release still has working script and stylesheet assets', async ({
  page,
}) => {
  const previous = fs.readFileSync('tests/fixtures/previous-release.html', 'utf8')
  const failures: string[] = []
  page.on('response', (r) => {
    if (r.status() >= 400) failures.push(r.url())
  })
  page.on('pageerror', (e) => failures.push(e.message))
  await page.route('http://127.0.0.1:4176/dentist/', (r) =>
    r.fulfill({ contentType: 'text/html', body: previous }),
  )
  await page.goto('/dentist/')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('#name')).toBeEnabled()
  expect(failures).toEqual([])
})

test('release validation rejects the source-only HTML that caused the first white screen', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tepla-release-check-'))
  try {
    fs.mkdirSync(path.join(directory, 'dist'))
    fs.copyFileSync('tests/fixtures/unbuilt-entry.html', path.join(directory, 'dist/index.html'))
    expect(() =>
      execFileSync(process.execPath, [path.resolve('scripts/verify-static.mjs')], {
        cwd: directory,
        env: {
          ...process.env,
          VITE_BASE_PATH: '/dentist/',
          VITE_SITE_URL: 'https://zoryanatepla.github.io',
        },
        stdio: 'pipe',
      }),
    ).toThrow(/exactly one h1/)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('new design is accessible, responsive and honours reduced motion', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/dentist/vash-shliakh-do-posmishky/')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `journey overflow at ${width}`,
    ).toBe(true)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/dentist/')
  const card = page.locator('.service-card').first()
  await card.hover()
  await expect(card.locator('.editorial-photo')).toHaveCSS('scale', '1')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  // Hover deliberately lifts the full card and zooms the image smoothly.
  await expect(card.locator('.editorial-photo')).toHaveCSS('scale', '1.1')
  await expect(card).toHaveCSS('scale', '1.035')
  await expect(card.locator('.editorial-photo')).toHaveCSS('transform', 'none')
  await expect(card).toHaveCSS('transform', 'none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of ['', 'vash-shliakh-do-posmishky/', 'poslugy/elainery/']) {
    await page.goto(`/dentist/${path}`)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
      .analyze()
    expect(
      results.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => ({ target: n.target, reason: n.failureSummary })),
      })),
    ).toEqual([])
    expect(await page.locator('html').evaluate((el) => getComputedStyle(el).scrollBehavior)).toBe(
      'auto',
    )
  }
})
