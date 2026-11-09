import { test, expect } from './fixtures'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('gallery preserves four ordered pairs, languages, mobile layout and reload', async ({
  page,
}) => {
  test.setTimeout(60000)
  const base = String(test.info().config.metadata.siteBase || '')
  for (const language of ['', 'en/']) {
    for (const width of [320, 390, 768, 1100, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(`${base}/${language}do-pislia/`)
      await expect(page.locator('h1')).toHaveText(language ? 'My work' : 'Мої роботи')
      await expect(page.locator('.cases-gallery .case-card')).toHaveCount(4)
      const sources = await page
        .locator('.cases-gallery img')
        .evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')))
      expect(sources).toEqual(
        Array.from(
          { length: 8 },
          (_, i) => `${base}/images/results/${String(i + 1).padStart(2, '0')}.webp`,
        ),
      )
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `overflow at ${width}`,
      ).toBe(true)
      for (const image of await page.locator('.cases-gallery img').all()) {
        await image.scrollIntoViewIfNeeded()
        await expect
          .poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
          .toBe(true)
      }
      if (language)
        expect(await page.locator('main').innerText()).not.toMatch(/[А-Яа-яІіЇїЄєҐґ]{3,}/)
    }
    await page.reload()
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', language ? 'en' : 'uk')
  }
})

test('home features pair five and six and both navigation menus reach the gallery', async ({
  page,
}) => {
  const base = String(test.info().config.metadata.siteBase || '')
  for (const language of ['', 'en/']) {
    await page.goto(`${base}/${language}`)
    const sources = await page
      .locator('#results img')
      .evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')))
    expect(sources).toEqual([`${base}/images/results/05.webp`, `${base}/images/results/06.webp`])
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.locator(`.desktop-nav a[href="${base}/${language}do-pislia/"]`).click()
    await expect(page.locator('h1')).toHaveText(language ? 'My work' : 'Мої роботи')
    await page.goto(`${base}/${language}`)
    await page.setViewportSize({ width: 390, height: 1000 })
    await page.locator('.menu-toggle').click()
    await page.locator(`.mobile-menu nav a[href="${base}/${language}do-pislia/"]`).click()
    await expect(page.locator('h1')).toHaveText(language ? 'My work' : 'Мої роботи')
  }
})

test('each gallery slider supports keyboard and mouse dragging independently, including full endpoints', async ({
  page,
}) => {
  const base = String(test.info().config.metadata.siteBase || '')
  await page.goto(`${base}/do-pislia/`)
  const sliders = page.getByRole('slider')
  await expect(sliders).toHaveCount(4)
  const first = sliders.first()
  await first.scrollIntoViewIfNeeded()
  await first.focus()
  await first.press('ArrowRight')
  await expect(first).toHaveValue('51')
  expect(
    await page
      .locator('.comparison-before')
      .first()
      .evaluate((el: HTMLElement) => el.style.clipPath),
  ).toContain('49%')
  await first.press('End')
  await expect(first).toHaveValue('100')
  await first.press('Home')
  await expect(first).toHaveValue('0')
  await expect(sliders.nth(1)).toHaveValue('50')
  const bounds = await first.boundingBox()
  if (!bounds) throw new Error('Slider has no visible bounds')
  await page.mouse.move(bounds.x + bounds.width * 0.2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width * 0.8, bounds.y + bounds.height / 2, { steps: 12 })
  await page.mouse.up()
  await expect(first).toHaveValue('80')
  await expect(sliders.nth(1)).toHaveValue('50')
  await page.goto(`${base}/#results`)
  const featured = page.getByRole('slider')
  await expect(featured).toHaveCount(1)
  await featured.focus()
  await featured.press('End')
  await expect(featured).toHaveValue('100')
})

test('mobile touch swipe moves the wipe divider', async ({ browser }) => {
  const base = String(test.info().config.metadata.siteBase || '')
  const origin = String(test.info().project.use.baseURL)
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  })
  try {
    const page = await context.newPage()
    await page.goto(`${origin}${base}/do-pislia/`)
    const slider = page.getByRole('slider').first()
    await slider.scrollIntoViewIfNeeded()
    const bounds = await slider.boundingBox()
    if (!bounds) throw new Error('Slider has no visible bounds')
    const client = await context.newCDPSession(page)
    const y = bounds.y + bounds.height / 2
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: bounds.x + bounds.width * 0.3, y }],
    })
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: bounds.x + bounds.width * 0.7, y }],
    })
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(slider).toHaveValue('70')
    await expect(page.getByRole('slider').nth(1)).toHaveValue('50')
  } finally {
    await context.close()
  }
})
