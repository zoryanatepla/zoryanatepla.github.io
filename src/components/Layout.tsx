import brand from '../data/brand.json'
import { useI18n } from '../i18n/I18n'
import { Preferences } from './Preferences'
import { withoutLanguage, languageForPath, localizedPath } from '../lib/locale'
import { Link } from '../i18n/I18n'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUp, ArrowUpRight, Instagram, Menu, Phone, X } from 'lucide-react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { site } from '../data/site'
import { Brand } from './ui'
import { publicUrl, seoForPath, schemaForPath } from '../lib/seo'
import { journeyPath } from '../data/journey'
import { silk } from '../motion/presets'

const navItems = [
  { label: 'Про лікаря', to: '/#about' },
  { label: 'Напрями лікування', to: '/#services' },
  { label: 'Мій підхід', to: '/#approach' },
  { label: 'Ваш шлях', to: journeyPath },
  { label: 'Мої роботи', to: '/do-pislia/' },
  { label: 'Менторство', to: '/mentorstvo/' },
  { label: 'Запитання', to: '/#faq' },
  { label: 'Контакти', to: '/#contacts' },
]

export function RouteEffects() {
  const { pathname, hash, key } = useLocation()
  const reduced = useReducedMotion()
  const first = useRef(true)
  const navigation = useNavigationType()
  const previous = useRef<{ key: string; pathname: string } | null>(null)
  const positions = useRef(new Map<string, number>())
  const applied = useRef('')
  useEffect(() => {
    const original = history.scrollRestoration
    history.scrollRestoration = 'manual'
    return () => {
      history.scrollRestoration = original
    }
  }, [])
  useEffect(() => {
    if (previous.current && previous.current.key !== key)
      positions.current.set(previous.current.key, window.scrollY)
    const changedPage = !!previous.current && previous.current.pathname !== pathname
    previous.current = { key, pathname }
    let frame = 0
    let arrival: Animation | undefined
    function apply() {
      const scene = document.querySelector<HTMLElement>('.page-content[data-page]')
      if (scene?.dataset.page !== pathname || applied.current === key) return
      applied.current = key
      const seo = seoForPath(pathname)
      document.title = seo.title
      const meta = (name: string, content: string, property = false) => {
        const attr = property ? 'property' : 'name'
        let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
        if (!element) {
          element = document.createElement('meta')
          element.setAttribute(attr, name)
          document.head.appendChild(element)
        }
        element.content = content
      }
      const language = languageForPath(pathname)
      document.documentElement.lang = language
      meta('og:locale', language === 'en' ? 'en_GB' : 'uk_UA', true)
      meta('og:site_name', language === 'en' ? brand.nameEn : brand.name, true)
      meta('description', seo.description)
      meta('og:title', seo.title, true)
      meta('og:description', seo.description, true)
      meta('robots', seo.noindex ? 'noindex, follow' : 'index, follow')
      const canonical = publicUrl(seo.path)
      if (canonical) {
        let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
        if (!link) {
          link = document.createElement('link')
          link.rel = 'canonical'
          document.head.appendChild(link)
        }
        link.href = canonical
        meta('og:url', canonical, true)
        document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove())
        if (!seo.noindex)
          for (const locale of ['uk', 'en', 'x-default']) {
            const alternate = document.createElement('link')
            alternate.rel = 'alternate'
            alternate.hreflang = locale
            alternate.href = publicUrl(localizedPath(pathname, locale === 'en' ? 'en' : 'uk'))!
            document.head.appendChild(alternate)
          }
        const structured = document.querySelector('script[type="application/ld+json"]')
        if (structured) structured.remove()
        if (!seo.noindex) {
          const script = document.createElement('script')
          script.type = 'application/ld+json'
          script.textContent = JSON.stringify({ ...schemaForPath(pathname), url: canonical })
          document.head.appendChild(script)
        }
      }
      frame = requestAnimationFrame(() => {
        if (navigation === 'POP' && positions.current.has(key)) {
          window.scrollTo({ top: positions.current.get(key)!, behavior: 'instant' })
        } else if (hash) {
          let id = hash.substring(1)
          try {
            id = decodeURIComponent(id)
          } catch {
            /* Invalid escapes should not break navigation. */
          }
          const target = document.getElementById(id)
          target?.scrollIntoView({
            behavior: reduced || first.current || changedPage ? 'instant' : 'smooth',
            block: 'start',
          })
          if (target && !reduced && !first.current && !changedPage) {
            arrival = target.animate([{ opacity: 0.72 }, { opacity: 1 }], {
              duration: 780,
              easing: silk.cssEase,
            })
          }
        } else {
          window.scrollTo({
            top: 0,
            behavior: reduced || first.current || changedPage ? 'instant' : 'smooth',
          })
          if (!first.current)
            document.getElementById('main-content')?.focus({ preventScroll: true })
        }
        first.current = false
      })
    }
    apply()
    document.addEventListener('site:scene-ready', apply)
    return () => {
      cancelAnimationFrame(frame)
      arrival?.cancel()
      document.removeEventListener('site:scene-ready', apply)
    }
  }, [pathname, hash, key, reduced, navigation])
  return null
}

export function Header() {
  const { t } = useI18n()

  const [open, setOpen] = useState(false)
  // A URL fragment is unavailable to static rendering. Apply its active state after hydration.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  const [scrolled, setScrolled] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const activeHash = hydrated ? location.hash : ''
  const reduced = useReducedMotion()
  useEffect(() => {
    setOpen(false)
  }, [location])
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 24)
    scroll()
    window.addEventListener('scroll', scroll, { passive: true })
    return () => window.removeEventListener('scroll', scroll)
  }, [])
  useEffect(() => {
    if (!open) return
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLElement>('a')?.focus()
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuButton.current?.focus()
      }
      if (e.key === 'Tab') {
        const items = [
          menuButton.current,
          ...Array.from(panel.current?.querySelectorAll<HTMLElement>('a') || []),
        ].filter(Boolean) as HTMLElement[]
        const index = items.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey && index <= 0) {
          e.preventDefault()
          items.at(-1)?.focus()
        }
        if (!e.shiftKey && index === items.length - 1) {
          e.preventDefault()
          items[0]?.focus()
        }
      }
    }
    const resize = () => {
      if (window.innerWidth > 1050) setOpen(false)
    }
    document.addEventListener('keydown', keydown)
    window.addEventListener('resize', resize)
    return () => {
      document.body.style.overflow = old
      document.removeEventListener('keydown', keydown)
      window.removeEventListener('resize', resize)
    }
  }, [open])
  return (
    <>
      <a className="skip-link" href="#main-content">
        {t('Перейти до вмісту')}
      </a>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label={t('Основна навігація')}>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  activeHash === item.to.slice(1) || withoutLanguage(location.pathname) === item.to
                    ? 'active'
                    : ''
                }
                aria-current={withoutLanguage(location.pathname) === item.to ? 'page' : undefined}
              >
                {t(item.label)}
                {(activeHash === item.to.slice(1) ||
                  withoutLanguage(location.pathname) === item.to) && (
                  <motion.span
                    className="nav-active-line"
                    layoutId="nav-active"
                    aria-hidden="true"
                    transition={{ duration: reduced ? 0 : 0.32, ease: silk.ease }}
                  />
                )}
              </Link>
            ))}
          </nav>
          <Preferences />
          <Link className="header-appointment" to="/#appointment">
            {t('Записатися ')}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <button
            ref={menuButton}
            className="menu-toggle round-button"
            aria-label={open ? t('Закрити меню') : t('Відкрити меню')}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={panel}
            className="mobile-menu"
            initial={{ opacity: 0, y: reduced ? 0 : -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -15 }}
            transition={{ duration: reduced ? 0 : 0.48, ease: silk.ease }}
          >
            <span className="tiny-caps">{t('Ваша посмішка. Моя турбота.')}</span>
            <motion.nav
              aria-label={t('Мобільна навігація')}
              initial="closed"
              animate="open"
              variants={{
                open: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } },
                closed: {},
              }}
            >
              {navItems.map((item) => (
                <motion.div
                  key={item.to}
                  variants={{
                    closed: { opacity: reduced ? 1 : 0.3, y: reduced ? 0 : 12 },
                    open: { opacity: 1, y: 0, transition: { duration: 0.48, ease: silk.ease } },
                  }}
                >
                  <Link
                    to={item.to}
                    aria-current={
                      withoutLanguage(location.pathname) === item.to ? 'page' : undefined
                    }
                  >
                    {t(item.label)}
                    <ArrowUpRight size={22} />
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
            <Link className="button button-primary" to="/#appointment">
              {t('Записатися на консультацію')}
              <ArrowUpRight size={18} />
            </Link>
            {site.contacts.phone && (
              <a className="mobile-phone" href={`tel:${site.contacts.phone}`}>
                {site.contacts.phoneDisplay}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function Footer() {
  const { t } = useI18n()

  return (
    <>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-column footer-identity">
              <Link to="/" className="footer-to-top">
                <span className="footer-up-icon">
                  <ArrowUp size={28} strokeWidth={1.3} aria-hidden="true" />
                </span>
                <span>
                  {t('На початок сайту')}
                  <small>{t('До першого знайомства')}</small>
                </span>
              </Link>
              <p className="footer-doctor-name">{t('Зоряна Тепла')}</p>
              <span className="footer-doctor-role">{t('Лікар стоматолог-ортодонт')}</span>
              <span className="footer-doctor-detail">{t('20+ років досвіду · Київ')}</span>
            </div>
            <div className="footer-column footer-voices">
              <span className="footer-kicker">{t('Слова, у яких — турбота')}</span>
              <blockquote className="footer-quote">
                {t('«Ваша посмішка. Моя професійна турбота.»')}
              </blockquote>
              <blockquote className="footer-quote">
                {t('«Кожна посмішка заслуговує на індивідуальний підхід.»')}
              </blockquote>
            </div>
            <div className="footer-column footer-contact">
              <span className="footer-kicker">{t('Залишаймося на зв’язку')}</span>
              {site.contacts.phone && (
                <a href={`tel:${site.contacts.phone}`} className="footer-contact-link">
                  <Phone size={17} strokeWidth={1.3} aria-hidden="true" />
                  <span>{site.contacts.phoneDisplay}</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              )}
              {site.contacts.instagram && (
                <a
                  href={site.contacts.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-contact-link"
                >
                  <Instagram size={18} strokeWidth={1.3} aria-hidden="true" />
                  <span>@dr.zoryana.tepla</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              )}
              <div className="footer-visit-note">
                <strong>{t('Прийом у клініці Лукашука')}</strong>
                <address>{t(site.contacts.address)}</address>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <Link to="/do-pislia/">{t('Мої роботи')}</Link>
            <Link to="/mentorstvo/">{t('Менторство')}</Link>
            <span>{t('© 2026 Зоряна Тепла. Київ, Україна.')}</span>
            <Link to="/polityka-konfidentsiinosti/">{t('Політика конфіденційності')}</Link>
            <Link to={journeyPath}>
              {t('Ваш шлях до посмішки ')}
              <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </div>
          <p className="medical-note">
            {t(
              'Інформація на сайті має ознайомчий характер і не замінює особисту консультацію лікаря. Діагноз і план лікування визначаються індивідуально.',
            )}
          </p>
        </div>
      </footer>
      <Link to="/#appointment" className="mobile-booking">
        {t('Записатися на консультацію')}
        <ArrowUpRight size={17} aria-hidden="true" />
      </Link>
    </>
  )
}
