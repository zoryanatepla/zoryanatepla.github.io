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

test('disabled form validates, does not transmit data, and never invents success', async ({
  page,
}) => {
  let submissions = 0
  page.on('request', (r) => {
    if (r.method() === 'POST') submissions++
  })
  await page.goto('http://localhost:4175/#appointment')
  await page.getByRole('button', { name: 'Надіслати заявку' }).click()
  await expect(page.locator('#error-name')).toBeVisible()
  await expect(page.locator('#name')).toBeFocused()
  await expect(page.locator('#error-phone')).toBeVisible()
  await expect(page.locator('#error-consent')).toBeVisible()
  await fillForm(page)
  await page.getByRole('button', { name: 'Надіслати заявку' }).click()
  await expect(page.getByRole('alert')).toContainText('Онлайн-запис поки недоступний')
  await expect(page.locator('.form-success')).toHaveCount(0)
  expect(submissions).toBe(0)
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 })
  expect(page.url()).not.toContain('670000000')
})

for (const scenario of ['accepted', 'rejected', 'unconfirmed', 'network', 'limited'] as const) {
  test(`configured Formspree endpoint: ${scenario}`, async ({ page }) => {
    let count = 0
    await page.route('https://formspree.io/f/testform', async (route) => {
      count++
      const data = route.request().postDataJSON()
      expect(data.name).toBe('Тестова заявка')
      expect(data.consent).toBe(true)
      expect(data._gotcha).toBe('')
      if (scenario === 'network') return route.abort()
      await route.fulfill({
        status: scenario === 'rejected' ? 500 : scenario === 'limited' ? 429 : 200,
        contentType: 'application/json',
        body: JSON.stringify(scenario === 'accepted' ? { ok: true } : { error: 'Test response' }),
      })
    })
    await page.goto('http://localhost:4174/#appointment')
    await fillForm(page)
    await page.getByRole('button', { name: 'Надіслати заявку' }).click()
    if (scenario === 'accepted')
      await expect(page.locator('.form-success')).toContainText('Сервіс прийняв вашу заявку')
    else {
      await expect(page.getByRole('alert')).toBeVisible()
      await expect(page.locator('.form-success')).toHaveCount(0)
      await expect(page.getByLabel('Ваше ім’я')).toHaveValue('Тестова заявка')
    }
    expect(count).toBe(1)
  })
}

test('honeypot prevents transmission', async ({ page }) => {
  let count = 0
  await page.route('https://formspree.io/f/testform', (route) => {
    count++
    return route.fulfill({ json: { ok: true } })
  })
  await page.goto('http://localhost:4174/#appointment')
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

for (const outcome of ['accepted', 'network'] as const) {
  test(`production Formspree address handles ${outcome} without sending real mail`, async ({
    page,
  }) => {
    let count = 0
    await page.route('https://formspree.io/f/xwllyzab', async (route) => {
      count++
      const data = route.request().postDataJSON()
      expect(data.name).toBe('Тестова заявка')
      expect(data.phone).toBe('+380670000000')
      expect(data.direction).toBe('Первинна консультація')
      expect(data.consent).toBe(true)
      expect(data._gotcha).toBe('')
      if (outcome === 'network') return route.abort()
      return route.fulfill({ status: 200, json: { ok: true } })
    })
    await page.goto('/#appointment')
    await expect(page.locator('form.appointment-form')).toHaveAttribute(
      'action',
      'https://formspree.io/f/xwllyzab',
    )
    await expect(page.locator('form .form-availability')).toHaveCount(0)
    await fillForm(page)
    await page.getByRole('button', { name: 'Надіслати заявку' }).click()
    if (outcome === 'accepted')
      await expect(page.locator('.form-success')).toContainText('Сервіс прийняв вашу заявку')
    else {
      await expect(page.getByRole('alert')).toBeVisible()
      await expect(page.getByLabel('Ваше ім’я')).toHaveValue('Тестова заявка')
      await expect(page.locator('.form-success')).toHaveCount(0)
    }
    expect(count).toBe(1)
    await expect(page.locator('#contacts a[href="mailto:orthodentua@gmail.com"]')).toHaveText(
      'Електронна поштаorthodentua@gmail.com',
    )
  })
}
