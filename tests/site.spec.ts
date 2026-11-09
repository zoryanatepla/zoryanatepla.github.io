import { test, expect } from './fixtures'
import AxeBuilder from '@axe-core/playwright'

test('home, real contacts, navigation and route-specific static HTML', async ({
  page,
  request,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Ваша посмішка.Моя професійнатурбота.',
  )
  await expect(page.locator('#contacts a[href="tel:+380679404225"]')).toBeVisible()
  await expect(
    page.locator('#contacts a[href="https://www.instagram.com/dr.zoryana.tepla"]'),
  ).toBeVisible()
  for (const [slug, title] of [
    ['brekety', 'Брекет-системи'],
    ['elainery', 'Прозорі елайнери'],
    ['dytiacha-ortodontiia', 'Дитяча ортодонтія'],
    ['hnatolohiia', 'Гнатологія'],
  ]) {
    const path = `/poslugy/${slug}/`
    const html = await (await request.get(path)).text()
    const prerenderedHeading = html
      .match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]
      .replace(/<[^>]*>/g, '')
    expect(prerenderedHeading).toBe(title)
    expect(html).not.toContain('<!--app-->')
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await page.getByRole('link', { name: 'Усі напрями лікування' }).click()
    await expect(page).toHaveURL(/\/#services$/)
    await expect(page.locator('#services')).toBeInViewport()
  }
  await page.goto('/polityka-konfidentsiinosti/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Політика')
  await page.goto('/not-a-page/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Повернімося')
  expect(errors).toEqual([])
})

test('FAQ and featured comparison support keyboard interaction', async ({ page }) => {
  await page.goto('/')
  const question = page.getByRole('button', { name: 'Чим відрізняються елайнери від брекетів?' })
  await question.click()
  await expect(question).toHaveAttribute('aria-expanded', 'true')
  await expect(
    page.getByRole('region', { name: 'Чим відрізняються елайнери від брекетів?' }),
  ).toBeVisible()
  await question.press('Enter')
  await expect(question).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#results .before-after-pair img')).toHaveCount(2)
  const slider = page.getByRole('slider', { name: 'Порівняння до та після' })
  await slider.focus()
  await slider.press('ArrowRight')
  await expect(slider).toHaveValue('51')
  await expect(page.locator('#results a[href="/do-pislia/"]')).toBeVisible()
  await expect(page.locator('.review-empty-label')).toContainText('Перші історії')
})

async function fillForm(page: import('@playwright/test').Page) {
  await page.getByLabel('Ваше ім’я').fill('Тестова заявка')
  await page.getByLabel('Номер телефону').fill('+380670000000')
  await page.getByLabel('Напрям звернення').selectOption('Первинна консультація')
  await page.getByRole('checkbox').check()
}

test('Telegram preview validates fields, preserves the draft, traps focus and never submits data', async ({
  page,
}) => {
  let submissions = 0
  page.on('request', (r) => {
    if (r.method() === 'POST') submissions++
  })
  await page.goto('/#appointment')
  await page.getByRole('button', { name: 'Надіслати заявку' }).click()
  await expect(page.locator('#error-name')).toBeVisible()
  await expect(page.locator('#name')).toBeFocused()
  await expect(page.locator('#error-phone')).toBeVisible()
  await expect(page.locator('#error-consent')).toBeVisible()
  await fillForm(page)
  await page.getByLabel('Ваш коментар').fill('Зручний час: після 18:00 & вихідні')
  await page.getByRole('button', { name: 'Надіслати заявку' }).click()
  const dialog = page.getByRole('dialog', { name: 'Заявка для Telegram' })
  await expect(dialog).toBeVisible()
  const text = await dialog.getByLabel('Текст заявки').inputValue()
  expect(text).toBe(
    'Вітаю! Хочу записатися на консультацію.\n\nІм’я: Тестова заявка\nНомер телефону: +380670000000\nДля кого консультація: Дорослий\nНапрям звернення: Первинна консультація\nКоментар: Зручний час: після 18:00 & вихідні',
  )
  const url = new URL(
    (await dialog.getByRole('link', { name: 'Відкрити Telegram' }).getAttribute('href'))!,
  )
  expect(url.origin + url.pathname).toBe('https://t.me/Zoryana_Tepla')
  expect(url.searchParams.get('text')).toBe(text)
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  }
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(axe.violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Надіслати заявку' })).toBeFocused()
  await expect(page.getByLabel('Ваше ім’я')).toHaveValue('Тестова заявка')
  expect(submissions).toBe(0)
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 })
  await expect(page.locator('#contacts a[href="mailto:orthodentua@gmail.com"]')).toBeVisible()
})

test('copy request handles clipboard success and denial without losing text', async ({ page }) => {
  for (const denied of [false, true]) {
    await page.goto('/#appointment')
    await page.evaluate(
      (denied) =>
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText: async (text: string) => {
              if (denied) throw new Error('denied')
              ;(window as Window & { copiedText?: string }).copiedText = text
            },
          },
        }),
      denied,
    )
    await fillForm(page)
    await page.getByRole('button', { name: 'Надіслати заявку' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Скопіювати заявку' }).click()
    const text = await dialog.getByLabel('Текст заявки').inputValue()
    if (denied) {
      await expect(dialog.getByRole('status')).toContainText('Скопіюйте його вручну')
      expect(
        await dialog
          .getByLabel('Текст заявки')
          .evaluate((el: HTMLTextAreaElement) => el.selectionEnd - el.selectionStart),
      ).toBe(text.length)
    } else {
      await expect(dialog.getByRole('status')).toHaveText('Заявку скопійовано')
      expect(
        await page.evaluate(() => (window as Window & { copiedText?: string }).copiedText),
      ).toBe(text)
    }
    await dialog.getByRole('button', { name: 'Закрити вікно' }).click()
  }
})

test('Telegram dialog fits mobile screens and uses English field labels', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 700 })
    await page.goto('/en/#appointment')
    await page.locator('#name').fill('Test visitor')
    await page.locator('#phone').fill('+380670000000')
    await page.locator('#direction').selectOption('Первинна консультація')
    await page.locator('#consent').check()
    await page.getByRole('button', { name: 'Send request' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    expect(await dialog.getByRole('textbox').inputValue()).toContain('Consultation for: Adult')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await dialog.getByRole('button', { name: 'Close dialog' }).click()
  }
})

test('honeypot prevents transmission', async ({ page }) => {
  let count = 0
  await page.route('https://formspree.io/f/testform', (route) => {
    count++
    return route.fulfill({ json: { ok: true } })
  })
  await page.goto('/#appointment')
  await fillForm(page)
  await page.locator('#website').evaluate((el: HTMLInputElement) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(el, 'spam.example')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await page.getByRole('button', { name: 'Надіслати заявку' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  expect(count).toBe(0)
})

test('responsive layouts, mobile menu focus and reduced motion', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `overflow at ${width}`,
    ).toBe(true)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  await page.setViewportSize({ width: 390, height: 844 })
  const menu = page.getByRole('button', { name: 'Відкрити меню' })
  await menu.click()
  await expect(page.getByRole('navigation', { name: 'Мобільна навігація' })).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Мобільна навігація' }).getByRole('link').first(),
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await menu.click()
  await page
    .getByRole('navigation', { name: 'Мобільна навігація' })
    .getByRole('link', { name: 'Напрями лікування' })
    .click()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#services')).toBeInViewport()
  expect(await page.locator('html').evaluate((el) => getComputedStyle(el).scrollBehavior)).toBe(
    'auto',
  )
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true })
})

test('prerendered content is readable without JavaScript; form cannot leak via GET', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('http://localhost:4173/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.locator('.hero-copy').evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
  await expect(page.getByRole('button', { name: 'Надіслати заявку' })).toBeDisabled()
  await context.close()
})

test('WCAG 2.2 AA automated checks on desktop, mobile, form and service', async ({ page }) => {
  for (const [path, width] of [
    ['/', 1440],
    ['/#appointment', 390],
    ['/poslugy/brekety/', 1440],
    ['/polityka-konfidentsiinosti/', 390],
  ] as const) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(path)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
      .analyze()
    expect(
      result.violations.map((v) => ({
        id: v.id,
        description: v.description,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([])
  }
})

test('mobile portrait shows the full forehead while desktop framing stays unchanged', async ({
  page,
}) => {
  for (const width of [320, 390, 700, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    const image = page.locator('.approach-visual > img')
    await image.scrollIntoViewIfNeeded()
    await image.evaluate((el: HTMLImageElement) => el.decode())
    const framing = await image.evaluate((el) => {
      const rect = el.getBoundingClientRect(),
        frame = el.parentElement!.getBoundingClientRect()
      return {
        scale: rect.width / frame.width,
        height: rect.height / frame.height,
        hair: (rect.top + rect.height * 0.26 - frame.top) / frame.height,
        transform: getComputedStyle(el).transform,
      }
    })
    if (width <= 700) {
      expect(framing.scale).toBeCloseTo(1, 2)
      expect(framing.hair).toBeGreaterThan(0)
      expect(framing.hair).toBeLessThan(0.06)
    } else {
      expect(framing.height).toBeCloseTo(1.34, 2)
      expect(framing.transform).toBe('none')
    }
  }
})
