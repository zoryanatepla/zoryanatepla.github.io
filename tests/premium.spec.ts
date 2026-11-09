import { test, expect } from './fixtures'
import AxeBuilder from '@axe-core/playwright'

test('three distinct original portraits load on mobile and desktop while service illustrations stay in place', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    const sources = new Set<string>()
    for (const language of ['', 'en/']) {
      await page.goto(`/${language}`)
      await expect(page.locator('.portrait-placeholder')).toHaveCount(0)
      for (const slot of ['hero', 'about']) {
        const image = page.locator(`.doctor-portrait--${slot}`)
        await image.scrollIntoViewIfNeeded()
        await expect(image).toBeVisible()
        await expect(image).toHaveAttribute('src', `/images/zoryana-tepla-${slot}.webp`)
        await expect(image).toHaveAttribute('loading', slot === 'hero' ? 'eager' : 'lazy')
        await expect(image).toHaveAttribute(
          'alt',
          language ? 'Zoryana Tepla — orthodontist' : 'Зоряна Тепла — лікар стоматолог-ортодонт',
        )
        await expect
          .poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
          .toBe(true)
        sources.add((await image.getAttribute('src'))!)
      }
      await expect(page.locator('.service-card .editorial-photo img')).toHaveCount(4)
      for (const [index, image] of (
        await page.locator('.service-card .editorial-photo img').all()
      ).entries()) {
        await expect(image).toHaveAttribute(
          'src',
          index === 3 ? '/images/gnathology-model.webp' : '/images/editorial-still-life.webp',
        )
      }
      await page.goto(`/${language}mentorstvo/`)
      const image = page.locator('.mentorship-visual .doctor-portrait')
      await image.scrollIntoViewIfNeeded()
      await expect(image).toBeVisible()
      await expect(image).toHaveAttribute('src', '/images/zoryana-tepla-mentorship.webp')
      await expect
        .poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true)
      sources.add((await image.getAttribute('src'))!)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
    }
    expect(sources.size).toBe(3)
  }
})

test('mentorship has complete static content, correct metadata and working request links', async ({
  page,
  request,
}) => {
  for (const language of ['', 'en/']) {
    const url = `/${language}mentorstvo/`
    const response = await request.get(url)
    expect(response.status()).toBe(200)
    const html = await response.text()
    expect(html).not.toContain('<!--app-->')
    expect(html).toContain(`https://zoryanatepla.github.io${url}`)
    await page.goto(url)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.mentorship-card')).toHaveCount(4)
    await expect(page.locator('.mentorship-topic')).toHaveCount(5)
    await expect(page.locator('.mentorship-stage')).toHaveCount(4)
    await expect(page.locator('.desktop-nav a[aria-current="page"]')).toHaveAttribute('href', url)
    await page.locator('.mentorship-intro .button').click()
    await expect(page.locator('#mentorship-about')).toBeInViewport()
    const requestLink = page.locator('.mentorship-request .button')
    await expect(requestLink).toHaveAttribute('href', 'https://www.instagram.com/dr.zoryana.tepla')
    await expect(requestLink).toHaveAttribute('rel', 'noopener noreferrer')
    await page.reload()
    await expect(page.locator('h1')).toBeVisible()
    if (language) expect(await page.locator('main').innerText()).not.toMatch(/[А-Яа-яІіЇїЄєҐґ]{3,}/)
    else
      await expect(page.locator('.mentorship-prose')).toContainText(
        'проведення програм чи навчальних курсів наразі не заявлено',
      )
  }
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('https://zoryanatepla.github.io/mentorstvo/')
  expect(sitemap).toContain('https://zoryanatepla.github.io/en/mentorstvo/')
  await page.goto('/vash-shliakh-do-posmishky/')
  await expect(page.locator('.journey-hero .encouragement')).toHaveCount(0)
  await expect(page.locator('.journey-art .doctor-portrait')).toBeVisible()
  await page.goto('/#faq')
  await page
    .getByRole('button', { name: 'Коли потрібна консультація з питань роботи щелепного суглоба?' })
    .click()
  await expect(page.locator('#faq-panel-5')).toContainText(
    'На консультації ви зможете описати свої відчуття',
  )
  await expect(page.locator('#faq-panel-5')).not.toContainText('Звернутися варто')
})

test('palette blends through intermediate colours and rapid changes settle without losing form state', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' })
  await page.goto('/#appointment')
  await page.locator('#name').fill('Перевірка теми')
  const samples = await page.evaluate(async () => {
    const selectors = ['body', '.site-header', '.form-card', '.invitation-section']
    const read = () =>
      selectors.map((s) => {
        const style = getComputedStyle(document.querySelector(s)!)
        return s === '.invitation-section' ? style.backgroundImage : style.backgroundColor
      })
    const initial = read()
    ;(document.querySelector('.theme-toggle') as HTMLButtonElement).click()
    const frames: string[][] = []
    const start = performance.now()
    await new Promise<void>((resolve) => {
      const sample = () => {
        frames.push(read())
        if (performance.now() - start < 950) requestAnimationFrame(sample)
        else resolve()
      }
      requestAnimationFrame(sample)
    })
    return { initial, frames, final: read() }
  })
  for (let i = 0; i < 4; i++) {
    expect(samples.initial[i]).not.toBe(samples.final[i])
    expect(
      samples.frames.some((f) => f[i] !== samples.initial[i] && f[i] !== samples.final[i]),
    ).toBe(true)
  }
  await expect(page.locator('#name')).toHaveValue('Перевірка теми')
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition')
  await page.locator('.theme-toggle').click()
  await page.locator('.theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('tepla-theme'))).toBe('dark')
  const tab = await context.newPage()
  await tab.goto('/mentorstvo/')
  await expect(tab.locator('html')).toHaveAttribute('data-theme', 'dark')
  await tab.locator('.theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await tab.close()
})

test('mentorship fits small screens, has accessible themes and keyboard mobile navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [320, 390, 768, 1100, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/mentorstvo/')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `width ${width}`,
    ).toBe(true)
    if (width === 390 || width === 1440) {
      for (const theme of ['light', 'dark']) {
        if ((await page.locator('html').getAttribute('data-theme')) !== theme)
          await page.locator('.theme-toggle').click()
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(
          result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
        ).toEqual([])
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.locator('.menu-toggle').click()
  const link = page.locator('#mobile-menu a[href="/mentorstvo/"]')
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/mentorstvo\/$/)
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('#mobile-menu')).toHaveCount(0)
  await expect(page.locator('.mobile-booking')).toBeHidden()
})

test('new content remains available without JavaScript and system theme applies with blocked storage', async ({
  browser,
}) => {
  const staticContext = await browser.newContext({ javaScriptEnabled: false })
  const page = await staticContext.newPage()
  await page.goto('http://127.0.0.1:4176/mentorstvo/')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('.mentorship-stage')).toHaveCount(4)
  await expect(page.locator('.mentorship-request .button')).toHaveAttribute(
    'href',
    'https://www.instagram.com/dr.zoryana.tepla',
  )
  await staticContext.close()
  const blocked = await browser.newContext({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await blocked.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError')
      },
    })
  })
  const p = await blocked.newPage()
  // Runs before React: a blocked storage API must not skip the system palette.
  await p.route('**/assets/*.js', (route) => route.abort())
  await p.goto('http://127.0.0.1:4176/mentorstvo/')
  await expect(p.locator('html')).toHaveAttribute('data-theme', 'dark')
  await blocked.close()
})

test('scroll reveals use distinct motions and reduced motion cancels theme and scroll animation', async ({
  page,
}) => {
  await page.goto('/mentorstvo/')
  await page.locator('.mentorship-card').first().scrollIntoViewIfNeeded()
  await expect(page.locator('.mentorship-card').first()).toHaveAttribute(
    'data-reveal-kind',
    'surface',
  )
  await page.locator('.mentorship-topic').first().scrollIntoViewIfNeeded()
  await expect(page.locator('.mentorship-topic').first()).toHaveAttribute(
    'data-reveal-kind',
    'surface',
  )
  await page.locator('.theme-toggle').click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition')
  await expect
    .poll(() =>
      page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length),
    )
    .toBe(0)
})
