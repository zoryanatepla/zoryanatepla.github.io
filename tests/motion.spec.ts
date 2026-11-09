import { test, expect } from './fixtures'

async function steady(page: import('@playwright/test').Page, path: string) {
  await expect(page.locator('.page-content')).toHaveAttribute('data-page', path)
  await expect(page.locator('#main-content')).toHaveAttribute('data-motion-phase', 'steady')
}

test('page exit precedes entry without empty frames or a replaced header', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/dentist/')
  await page.evaluate(() => {
    const w = window as typeof window & { framesLog: unknown[]; recordFrames: boolean }
    w.framesLog = []
    w.recordFrames = true
    const header = document.querySelector('header')
    const frame = (time: number) => {
      const scene = document.querySelector<HTMLElement>('.page-content')
      w.framesLog.push({
        time,
        path: scene?.dataset.page,
        count: document.querySelectorAll('.page-content').length,
        opacity: scene ? +getComputedStyle(scene).opacity : 0,
        phase: document.querySelector<HTMLElement>('main')?.dataset.motionPhase,
        sameHeader: header === document.querySelector('header'),
      })
      if (w.recordFrames) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })
  await page.locator('.desktop-nav a[href$="vash-shliakh-do-posmishky/"]').click()
  await steady(page, '/vash-shliakh-do-posmishky/')
  const frames = await page.evaluate(() => {
    const w = window as typeof window & {
      framesLog: Array<{
        time: number
        path: string
        count: number
        opacity: number
        phase: string
        sameHeader: boolean
      }>
      recordFrames: boolean
    }
    w.recordFrames = false
    return w.framesLog
  })
  expect(frames.every((f) => f.count === 1 && f.opacity > 0.09 && f.sameHeader)).toBe(true)
  const leaving = frames.find((f) => f.phase === 'leaving')!
  const entered = frames.find((f) => f.path === '/vash-shliakh-do-posmishky/')!
  expect(leaving).toBeTruthy()
  expect(entered.time - leaving.time).toBeGreaterThan(180)
  expect(frames.some((f) => f.path === '/vash-shliakh-do-posmishky/' && f.opacity < 0.9)).toBe(true)
  expect(errors).toEqual([])
})

test('navigation remains interactive and the latest click wins during exit', async ({ page }) => {
  await page.goto('/dentist/')
  await page
    .locator('.desktop-nav a[href$="vash-shliakh-do-posmishky/"]')
    .dispatchEvent('click', { button: 0 })
  await page.waitForTimeout(70)
  await page.locator('.header-appointment').dispatchEvent('click', { button: 0 })
  await expect(page).toHaveURL(/\/dentist\/#appointment$/)
  await steady(page, '/')
  await expect(page.locator('#appointment')).toBeInViewport()
  await expect(page.locator('#name')).toBeEnabled()
  expect(
    await page.locator('header').evaluate((el) => getComputedStyle(el).pointerEvents),
  ).not.toBe('none')
})

test('back and forward animate and restore the saved scroll position', async ({ page }) => {
  await page.goto('/dentist/#services')
  await expect(page.locator('#services')).toBeInViewport()
  await page
    .locator('.service-card')
    .first()
    .evaluate((el) =>
      el.addEventListener(
        'click',
        () => {
          ;(window as typeof window & { departureY: number }).departureY = scrollY
        },
        { capture: true, once: true },
      ),
    )
  await page.locator('.service-card').first().click()
  const before = await page.evaluate(
    () => (window as typeof window & { departureY: number }).departureY,
  )
  await steady(page, '/poslugy/brekety/')
  expect(await page.evaluate(() => scrollY)).toBeLessThan(3)
  await page.goBack()
  await steady(page, '/')
  await expect
    .poll(async () => Math.abs((await page.evaluate(() => scrollY)) - before))
    .toBeLessThan(6)
  await page.goForward()
  await steady(page, '/poslugy/brekety/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Брекет-системи')
})

test('step details fade out before changing and rapid keyboard choices settle correctly', async ({
  page,
}) => {
  await page.goto('/dentist/vash-shliakh-do-posmishky/')
  const tabs = page.getByRole('tab')
  await tabs.first().focus()
  await tabs.first().press('End')
  await expect(page.locator('.journey-panels')).toHaveAttribute('aria-busy', 'true')
  await expect(page.locator('#journey-panel-0')).toBeVisible()
  await expect(page.locator('#journey-panel-5')).toBeVisible()
  await tabs.last().press('Home')
  await tabs.first().press('ArrowDown')
  await expect(page.locator('#journey-panel-1')).toBeVisible()
  await expect(page.locator('.journey-panels')).toHaveAttribute('aria-busy', 'false')
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toHaveCount(1)
  const rail = page.locator('.journey-rail > span')
  await page.locator('#journey-stages').scrollIntoViewIfNeeded()
  const start = await rail.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).d)
  await page.evaluate(() => {
    const el = document.getElementById('journey-stages')!
    scrollTo({ top: el.offsetTop + el.offsetHeight - innerHeight / 2, behavior: 'instant' })
  })
  await expect
    .poll(async () =>
      rail.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).d),
    )
    .toBeGreaterThan(start + 0.1)
})

test('switching reduced motion on mid-transition cancels movement immediately', async ({
  page,
}) => {
  await page.goto('/dentist/')
  await page
    .locator('.desktop-nav a[href$="vash-shliakh-do-posmishky/"]')
    .dispatchEvent('click', { button: 0 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.page-content')).toHaveAttribute(
    'data-page',
    '/vash-shliakh-do-posmishky/',
    { timeout: 1200 },
  )
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced')
  await expect
    .poll(async () =>
      page
        .locator('h1 .motion-word')
        .evaluateAll((elements) => elements.every((el) => getComputedStyle(el).opacity === '1')),
    )
    .toBe(true)
  expect(await page.locator('html').evaluate((el) => getComputedStyle(el).scrollBehavior)).toBe(
    'auto',
  )
  await page.getByRole('tab').last().click()
  await expect(page.locator('#journey-panel-5')).toBeVisible({ timeout: 500 })
  await expect
    .poll(async () =>
      page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length),
    )
    .toBe(0)
})

test('animated typography fits every page on mobile, tablet and desktop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of [
      '',
      'poslugy/brekety/',
      'poslugy/elainery/',
      'poslugy/dytiacha-ortodontiia/',
      'poslugy/hnatolohiia/',
      'vash-shliakh-do-posmishky/',
      'polityka-konfidentsiinosti/',
    ]) {
      await page.goto(`/dentist/${path}`)
      await expect(page.locator('h1')).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} at ${width}`,
      ).toBe(true)
    }
  }
})

test('decorative numbering is absent in service cards and every mentorship block', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/dentist/')
  await expect(page.locator('.service-card')).toHaveCount(4)
  await expect(page.locator('.service-number')).toHaveCount(0)
  for (const language of ['', 'en/']) {
    await page.goto(`/dentist/${language}mentorstvo/`)
    await expect(
      page.locator(
        '.mentorship-index, .mentorship-stage-number, .mentorship-rail, .mentorship-visual-rule',
      ),
    ).toHaveCount(0)
    await expect(
      page.locator('.mentorship-visual-caption > span, .mentorship-card-top > span'),
    ).toHaveCount(0)
    await expect(page.locator('.mentorship-card')).toHaveCount(4)
    await expect(page.locator('.mentorship-topic')).toHaveCount(5)
    await expect(page.locator('.mentorship-stage')).toHaveCount(4)
    await expect(page.locator('.mentorship-visual .doctor-portrait')).toBeVisible()
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      for (const selector of ['.mentorship-topic', '.mentorship-stage']) {
        const inset = await page
          .locator(selector)
          .first()
          .evaluate(
            (el) =>
              el.querySelector('h3')!.getBoundingClientRect().left -
              el.getBoundingClientRect().left,
          )
        expect(inset).toBeLessThan(3)
      }
    }
  }
})

test('the first screen animates from the main headline before any scrolling', async ({ page }) => {
  await page.goto('/dentist/', { waitUntil: 'domcontentloaded' })
  const hero = await page.locator('.hero h1').evaluate((el) => {
    const words = [...el.querySelectorAll<HTMLElement>('.motion-word')]
    return {
      y: scrollY,
      css: words.map((word) => getComputedStyle(word).animationName),
      delays: words.map((word) => getComputedStyle(word).animationDelay),
      frames: words.map((word) => +getComputedStyle(word).opacity),
      active: el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
      initialPromise: getComputedStyle(document.querySelector('.hero-promise')!).animationName,
      initialDescription: getComputedStyle(document.querySelector('.hero-description p')!)
        .animationName,
      initialAction: getComputedStyle(document.querySelector('.hero-actions .button')!)
        .animationName,
      image: getComputedStyle(document.querySelector('.hero-photo-frame')!).animationName,
    }
  })
  expect(hero.y).toBe(0)
  expect(hero.active).toBeGreaterThan(0)
  expect(hero.css.every((name) => name === 'hero-intro-word')).toBe(true)
  expect(new Set(hero.delays).size).toBeGreaterThan(1)
  expect(Math.min(...hero.frames)).toBeLessThan(0.8)
  expect(hero.initialPromise).toBe('hero-intro-copy')
  expect(hero.initialDescription).toBe('hero-intro-copy')
  expect(hero.initialAction).toBe('hero-intro-copy')
  expect(hero.image).toBe('hero-intro-image')
  await expect
    .poll(() =>
      page
        .locator('.hero h1 .motion-word')
        .evaluateAll((els) => els.every((el) => getComputedStyle(el).opacity === '1')),
    )
    .toBe(true)
})

test('paragraphs and words have visible entrances, with no clipping or nested movement', async ({
  page,
}) => {
  await page.goto('/dentist/mentorstvo/')
  const paragraph = page.locator('.mentorship-prose > p').last()
  const heading = page.locator('.mentorship-about h2').first()
  await expect(paragraph).toHaveAttribute('data-motion-unit', 'true')
  await paragraph.evaluate((el) =>
    scrollTo({
      top: el.getBoundingClientRect().top + scrollY - innerHeight - 80,
      behavior: 'instant',
    }),
  )
  await expect(paragraph).toHaveAttribute('data-scroll-state', 'ready')
  await paragraph.evaluate((el) =>
    scrollTo({
      top: el.getBoundingClientRect().top + scrollY - innerHeight + 180,
      behavior: 'instant',
    }),
  )
  await expect(paragraph).toHaveAttribute('data-scroll-state', 'running')
  const evidence = await paragraph.evaluate(async (el) => {
    const read = () => {
      const style = getComputedStyle(el)
      return {
        opacity: +style.opacity,
        y: new DOMMatrixReadOnly(style.transform).f,
        clip: style.clipPath,
      }
    }
    const samples = [read()]
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => setTimeout(resolve, 90))
      samples.push(read())
    }
    const targets = document
      .getAnimations()
      .filter((a) => a.id === 'scroll-reveal')
      .map((a) => (a.effect as KeyframeEffect).target as Element)
    return { samples, nested: targets.some((a) => targets.some((b) => a !== b && a.contains(b))) }
  })
  expect(evidence.samples[0].opacity).toBeLessThan(0.7)
  expect(evidence.samples[0].y).toBe(0)
  expect(evidence.samples.every((s) => s.y <= 24 && s.clip === 'none')).toBe(true)
  expect(evidence.samples.at(-1)!.opacity).toBeGreaterThan(evidence.samples[0].opacity)
  expect(evidence.samples.at(-1)!.y).toBe(0)
  expect(evidence.nested).toBe(false)
  await expect(heading).toHaveAttribute('data-reveal-kind', 'heading')
  expect(
    await heading
      .locator('.motion-word-mask')
      .evaluateAll((els) => els.every((el) => getComputedStyle(el).overflow === 'visible')),
  ).toBe(true)
})

test('text replays when scrolling back, including the very first headline', async ({ page }) => {
  await page.goto('/dentist/')
  const headline = page.locator('.hero h1')
  await expect(headline).toHaveAttribute('data-reveal-count', '1')
  await page
    .locator('#about')
    .evaluate((el) =>
      scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }),
    )
  await expect(headline).toHaveAttribute('data-scroll-state', 'ready')
  const about = page.locator('#about h2')
  await expect(about).toHaveAttribute('data-scroll-state', 'running')
  const count = Number(await about.getAttribute('data-reveal-count'))
  await page
    .locator('#faq')
    .evaluate((el) =>
      scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }),
    )
  await expect(about).toHaveAttribute('data-scroll-state', 'ready')
  await page
    .locator('#about')
    .evaluate((el) =>
      scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }),
    )
  await expect(about).toHaveAttribute('data-reveal-count', String(count + 1))
  await expect(about).toHaveAttribute('data-scroll-state', 'running')
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  await expect(headline).toHaveAttribute('data-reveal-count', '2')
  expect(
    await headline.evaluate((el) =>
      el
        .getAnimations({ subtree: true })
        .some((a) => a.id === 'scroll-reveal' && a.playState === 'running'),
    ),
  ).toBe(true)
})

test('rapid scrolling still reveals text and finishes without replaying while it remains visible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dentist/')
  for (const id of ['services', 'faq', 'contacts', 'about', 'services']) {
    await page
      .locator(`#${id}`)
      .evaluate((el) =>
        scrollTo({ top: el.getBoundingClientRect().top + scrollY - 110, behavior: 'instant' }),
      )
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    )
  }
  const heading = page.locator('#services h2')
  await expect(heading).toHaveAttribute('data-scroll-state', 'running')
  const count = await heading.getAttribute('data-reveal-count')
  expect(Number(count)).toBeGreaterThanOrEqual(2)
  await expect(heading).toHaveAttribute('data-scroll-state', 'settled')
  expect(await heading.getAttribute('data-reveal-count')).toBe(count)
  expect(
    await heading
      .locator('.motion-word')
      .evaluateAll((els) => els.every((el) => getComputedStyle(el).opacity === '1')),
  ).toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect
    .poll(() =>
      page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length),
    )
    .toBe(0)
  expect(await heading.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
})

test('cards, images, forms and maps reveal as complete surfaces using stationary anchors', async ({
  page,
}) => {
  await page.goto('/dentist/')
  for (const selector of ['.service-card', '.form-card', '.map-card', '.review-content']) {
    const surface = page.locator(selector).first()
    await expect(surface).toHaveAttribute('data-reveal-kind', 'surface')
    await surface.evaluate((el) => {
      const anchor = el.closest('[data-motion-anchor]') || el.closest('[data-motion-reveal]')!
      scrollTo({
        top: anchor.getBoundingClientRect().top + scrollY - innerHeight - 80,
        behavior: 'instant',
      })
    })
    await expect(surface).toHaveAttribute('data-scroll-state', 'ready')
    await surface.evaluate((el) => {
      const anchor = el.closest('[data-motion-anchor]') || el.closest('[data-motion-reveal]')!
      scrollTo({
        top: anchor.getBoundingClientRect().top + scrollY - innerHeight + 180,
        behavior: 'instant',
      })
    })
    await expect(surface).toHaveAttribute('data-scroll-state', 'running')
    const frames = await surface.evaluate(async (el) => {
      const anchor = el.closest('[data-motion-anchor]') || el.closest('[data-motion-reveal]')!
      const read = () => ({
        anchor: anchor.getBoundingClientRect().top,
        y: new DOMMatrixReadOnly(getComputedStyle(el).transform).f,
        opacity: +getComputedStyle(el).opacity,
      })
      const first = read()
      await new Promise((resolve) => setTimeout(resolve, 160))
      return {
        first,
        next: read(),
        childrenAnimate: [...el.querySelectorAll('p,h3,input')].some((child) =>
          child.getAnimations({ subtree: true }).some((a) => a.id === 'scroll-reveal'),
        ),
      }
    })
    expect(frames.first.opacity).toBeLessThan(0.9)
    expect(frames.first.y).toBeGreaterThan(5)
    expect(Math.abs(frames.next.anchor - frames.first.anchor)).toBeLessThan(0.1)
    expect(frames.next.y).toBeLessThan(frames.first.y)
    expect(frames.childrenAnimate).toBe(false)
    if (selector === '.form-card') {
      await page.locator('#name').focus()
      await expect(surface).toHaveAttribute('data-scroll-state', 'settled')
      await page.locator('#name').fill('Збережені дані')
      await expect(page.locator('#name')).toHaveValue('Збережені дані')
    }
  }
  await page.goto('/dentist/poslugy/brekety/')
  await expect(page.locator('.service-page-photo')).toHaveAttribute('data-reveal-kind', 'image')
  await page.goto('/dentist/mentorstvo/')
  await expect(page.locator('.mentorship-request')).toContainText('Напишіть мені в Instagram')
  await expect(page.locator('.mentorship-request')).not.toContainText('Напишіть Зоряні Теплій')
})

test('map card is compact, the photo has no quote plaque, and pointer hover is large and smooth', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/dentist/')
  await expect(page.locator('.approach-quote')).toHaveCount(0)
  await expect(page.locator('.approach-visual .editorial-photo')).toBeVisible()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    const gap = await page
      .locator('.map-card')
      .evaluate(
        (el) =>
          el.getBoundingClientRect().bottom -
          el.querySelector('.map-caption')!.getBoundingClientRect().bottom,
      )
    expect(gap).toBeLessThan(3)
    expect(gap).toBeGreaterThanOrEqual(0)
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const card = page.locator('.service-card').first()
  await card.hover()
  await expect(card).toHaveAttribute('data-scroll-state', 'settled')
  await expect
    .poll(() => card.evaluate((el) => parseFloat(getComputedStyle(el).scale)))
    .toBeGreaterThan(1.03)
  const enlarged = await card.evaluate((el) => ({
    lift: getComputedStyle(el).translate,
    duration: getComputedStyle(el).transitionDuration,
    imageScale: parseFloat(getComputedStyle(el.querySelector('.editorial-photo')!).scale),
    anchorTop: el.parentElement!.getBoundingClientRect().top,
  }))
  expect(parseFloat(enlarged.lift.split(' ')[1])).toBeLessThan(-15)
  expect(enlarged.duration).toContain('1s')
  await expect
    .poll(() =>
      card.locator('.editorial-photo').evaluate((el) => parseFloat(getComputedStyle(el).scale)),
    )
    .toBeGreaterThan(1.09)
  await page.mouse.move(0, 100)
  await expect
    .poll(() => card.evaluate((el) => parseFloat(getComputedStyle(el).scale)))
    .toBeLessThan(1.001)
  await page.locator('.header-appointment').hover()
  await expect
    .poll(() =>
      page.locator('.header-appointment').evaluate((el) => parseFloat(getComputedStyle(el).scale)),
    )
    .toBeGreaterThan(1.05)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await card.hover()
  await expect(card.locator('.editorial-photo')).toHaveCSS('scale', '1')
})

test('home refresh clears the section fragment and returns to the hero, while direct routes still work', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const locale of ['', 'en/']) {
    await page.goto(`/dentist/${locale}?view=refresh#about`)
    await expect(page.locator('#about')).toBeInViewport()
    await page.reload()
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(3)
    expect(new URL(page.url()).hash).toBe('')
    expect(new URL(page.url()).searchParams.get('view')).toBe('refresh')
    await expect(page.locator('.hero h1')).toBeInViewport()
    await page.locator('.desktop-nav a[href$="#services"]').click()
    await expect(page.locator('#services')).toBeInViewport()
    await page.reload()
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(3)
  }
  await page.goto('/dentist/mentorstvo/')
  await page.reload()
  await expect(page).toHaveURL(/\/mentorstvo\/$/)
  await expect(page.locator('h1')).toContainText('Менторство')
})
