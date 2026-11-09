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
      await expect(page.locator('h1')).toHaveText(language ? 'Before / After' : 'До / Після')
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
    await expect(page.locator('h1')).toHaveText(language ? 'Before / After' : 'До / Після')
    await page.goto(`${base}/${language}`)
    await page.setViewportSize({ width: 390, height: 1000 })
    await page.locator('.menu-toggle').click()
    await page.locator(`.mobile-menu nav a[href="${base}/${language}do-pislia/"]`).click()
    await expect(page.locator('h1')).toHaveText(language ? 'Before / After' : 'До / Після')
  }
})
