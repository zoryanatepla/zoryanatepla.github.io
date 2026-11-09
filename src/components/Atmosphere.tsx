import { useI18n } from '../i18n/I18n'
import { AnimatedHeading } from '../motion/AnimatedHeading'
import { useEffect } from 'react'
import { motion, useScroll, useSpring, useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Link } from '../i18n/I18n'
import { Reveal } from './ui'
import { revealFrames, silk } from '../motion/presets'

export function MotionEnvironment() {
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    for (const [key, value] of Object.entries({
      micro: silk.micro,
      text: silk.text,
      section: silk.section,
    }))
      document.documentElement.style.setProperty(`--motion-${key}`, `${value * 1000}ms`)
    document.documentElement.style.setProperty('--motion-ease', silk.cssEase)
    const sync = () => {
      document.documentElement.dataset.motion = preference.matches ? 'reduced' : 'full'
    }
    sync()
    preference.addEventListener('change', sync)
    return () => {
      preference.removeEventListener('change', sync)
    }
  }, [])
  return null
}

export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 110, damping: 28 })
  const reduced = useReducedMotion()
  return (
    <motion.div
      className="reading-progress"
      aria-hidden="true"
      style={{ scaleX: reduced ? scrollYProgress : scaleX }}
    />
  )
}

// Atomic text/image units: repeat on viewport entry without moving a container
// and its text together. Server HTML stays complete and readable without JS.
const images = '.hero-photo-frame, .about-photo-frame, .editorial-photo'
const surfaces =
  '.service-card, .form-card, .map-card, .mentorship-card, .mentorship-topic, .mentorship-stage, .preparation-card, .journey-summary, .comparison-wrap, .case-card, .review-content, .service-note, .association, .encouragement, .step, .journey-explorer, .mentorship-visual, .journey-art, .approach-visual'

const text = [
  '[data-motion-heading]',
  'p',
  'blockquote',
  '.eyebrow',
  '.tiny-caps',
  '.button',
  '.text-link',
  '.experience-note',
  '.hero-bottom',
  '.hero-photo-footer',
  '.trust-grid > div',
  '.association > span',
  '.doctor-signature',
  '.faq-item h3 button',
  '.field label',
  '.patient-options legend',
  '.consent > span',
  '.journey-tabs button',
  '.contact-details > a',
  '.contact-label',
  '.footer-doctor-role',
  '.footer-doctor-detail',
  '.footer-kicker',
  '.footer-to-top',
  '.footer-contact-link',
  '.footer-visit-note',
  '.footer-bottom > *',
].join(', ')
const intro =
  '.hero-promise, .hero h1, .hero-description p, .hero-actions > *, .hero-bottom, .hero-photo-frame, .hero .experience-note, .hero-photo-footer'

type MotionUnit = {
  el: HTMLElement
  anchor: HTMLElement
  opacity: number
  inside: boolean
  intro: boolean
  animations: Set<Animation>
}

export function DetailMotion() {
  const { pathname } = useLocation()
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const units = new Map<HTMLElement, MotionUnit>()
    let observer: IntersectionObserver | undefined
    let disposed = false

    function cancel(unit: MotionUnit) {
      unit.animations.forEach((animation) => {
        animation.onfinish = null
        animation.oncancel = null
        animation.cancel()
      })
      unit.animations.clear()
    }
    function settled(unit: MotionUnit) {
      if (!unit.animations.size) unit.el.dataset.scrollState = 'settled'
    }
    function animate(unit: MotionUnit, target: HTMLElement, frames: Keyframe[], delay = 0) {
      const animation = target.animate(frames, {
        duration:
          (unit.el.dataset.revealKind === 'image' || unit.el.dataset.revealKind === 'surface'
            ? silk.section
            : silk.text) * 1000,
        delay,
        easing: silk.scrollEase,
        fill: 'backwards',
      })
      animation.id = 'scroll-reveal'
      unit.animations.add(animation)
      animation.onfinish = () => {
        unit.animations.delete(animation)
        animation.cancel()
        settled(unit)
      }
    }
    function enter(unit: MotionUnit) {
      cancel(unit)
      unit.el.dataset.scrollState = 'running'
      unit.el.dataset.revealCount = String(Number(unit.el.dataset.revealCount || 0) + 1)
      if (unit.el.contains(document.activeElement)) {
        settled(unit)
        return
      }
      if (unit.el.matches('[data-motion-heading]')) {
        unit.el.querySelectorAll<HTMLElement>('.motion-word').forEach((word, index) => {
          animate(
            unit,
            word,
            [
              { opacity: 0.08, transform: 'translateY(28px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            Math.min(index * silk.stagger * 1000, 315),
          )
        })
      } else {
        const visual =
          unit.el.dataset.revealKind === 'image' || unit.el.dataset.revealKind === 'surface'
        const frames: Keyframe[] = visual
          ? [
              { opacity: 0.08, transform: 'translateY(30px) scale(.985)' },
              { opacity: 1, transform: 'translateY(0) scale(1)' },
            ]
          : revealFrames
        animate(
          unit,
          unit.el,
          frames.map((frame) => ({ ...frame, opacity: Number(frame.opacity) * unit.opacity })),
        )
      }
      settled(unit)
    }
    function stop() {
      observer?.disconnect()
      units.forEach((unit) => {
        cancel(unit)
        unit.el.dataset.scrollState = 'settled'
      })
      units.clear()
    }
    function start() {
      stop()
      if (preference.matches || !('IntersectionObserver' in window)) return
      const scope = document.querySelector('.page-content')
      const candidates = [
        ...Array.from(
          scope?.querySelectorAll<HTMLElement>(`${surfaces}, ${images}, ${text}`) || [],
        ),
        ...Array.from(document.querySelectorAll<HTMLElement>(`.site-footer :is(${text})`)),
      ]
      const selected = new Set(candidates)
      const anchored = new Map<HTMLElement, MotionUnit>()
      // A heading owns its words; a paragraph owns its links. These units have
      // no animated ancestor, so strong entrances do not compound or crop text.
      for (const el of candidates) {
        let ancestor = el.parentElement
        let nested = false
        while (ancestor && ancestor !== scope && !ancestor.matches('.site-footer')) {
          if (selected.has(ancestor)) {
            nested = true
            break
          }
          ancestor = ancestor.parentElement
        }
        if (nested) continue
        const isIntro = el.matches(intro)
        const unit: MotionUnit = {
          el,
          anchor:
            el.closest<HTMLElement>('[data-motion-anchor]') ||
            (el.matches('.service-card, .association')
              ? el.closest<HTMLElement>('[data-motion-reveal]')
              : null) ||
            (el.matches('.hero-photo-frame') ? el.closest<HTMLElement>('.hero-visual') : null) ||
            (el.matches('.about-photo-frame') ? el.parentElement : null) ||
            el,
          opacity: isIntro ? 1 : Number(getComputedStyle(el).opacity),
          inside: false,
          intro: isIntro,
          animations: new Set(),
        }
        units.set(el, unit)
        anchored.set(unit.anchor, unit)
        el.dataset.motionUnit = 'true'
        el.dataset.revealKind = el.matches(surfaces)
          ? 'surface'
          : el.matches(images)
            ? 'image'
            : el.matches('[data-motion-heading]')
              ? 'heading'
              : 'text'
        el.style.setProperty('--reveal-opacity', String(unit.opacity))
        const rect = el.getBoundingClientRect()
        const visible = rect.bottom > 0 && rect.top < innerHeight && rect.height > 0
        if (isIntro && visible) {
          // CSS starts the opening sequence at first paint, before hydration.
          el.dataset.revealCount = '1'
          el.dataset.scrollState = 'running'
          el.getAnimations({ subtree: true }).forEach((animation) => {
            if (
              animation instanceof CSSAnimation &&
              animation.animationName.startsWith('hero-intro')
            ) {
              unit.animations.add(animation)
              animation.finished.then(
                () => {
                  if (disposed) return
                  unit.animations.delete(animation)
                  settled(unit)
                },
                () => {},
              )
            }
          })
          settled(unit)
        } else {
          unit.intro = false
          if (isIntro)
            el.getAnimations({ subtree: true }).forEach((a) => {
              if (a instanceof CSSAnimation && a.animationName.startsWith('hero-intro')) a.cancel()
            })
          el.dataset.scrollState = visible ? 'idle' : 'ready'
        }
      }
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const unit = anchored.get(entry.target as HTMLElement)
            if (!unit) continue
            if (entry.isIntersecting && entry.boundingClientRect.height > 0) {
              if (unit.inside) continue
              unit.inside = true
              if (unit.intro) {
                unit.intro = false
                continue
              }
              enter(unit)
            } else {
              unit.inside = false
              unit.intro = false
              cancel(unit)
              unit.el.dataset.scrollState = unit.el.contains(document.activeElement)
                ? 'settled'
                : 'ready'
            }
          }
        },
        { threshold: 0 },
      )
      units.forEach((unit) => observer?.observe(unit.anchor))
    }
    function focus(event: FocusEvent) {
      const target = event.target as Node
      units.forEach((unit) => {
        if (unit.el.contains(target)) {
          cancel(unit)
          unit.el.dataset.scrollState = 'settled'
          unit.inside = true
        }
      })
    }
    start()
    preference.addEventListener('change', start)
    document.addEventListener('focusin', focus)
    return () => {
      disposed = true
      stop()
      preference.removeEventListener('change', start)
      document.removeEventListener('focusin', focus)
    }
  }, [pathname])
  return null
}

export function Encouragement({
  children,
  label = 'З увагою до вас',
  dark = false,
}: {
  children: React.ReactNode
  label?: string
  dark?: boolean
}) {
  const { t } = useI18n()

  return (
    <Reveal className={`encouragement ${dark ? 'encouragement-dark' : ''}`}>
      <span className="encouragement-icon">
        <Sparkles size={19} strokeWidth={1.2} aria-hidden="true" />
      </span>
      <div>
        <span className="tiny-caps">{t(label)}</span>
        <p>{children}</p>
      </div>
    </Reveal>
  )
}

export function Invitation({
  title,
  text,
  to = '/#appointment',
  link = 'Почнімо з консультації',
}: {
  title: string
  text: string
  to?: string
  link?: string
}) {
  const { t } = useI18n()

  return (
    <section className="invitation-section">
      <div className="container invitation-layout">
        <span className="invitation-orbit" aria-hidden="true">
          <span />
          <span />
          <Sparkles strokeWidth={0.8} />
        </span>
        <div>
          <span className="tiny-caps">{t('Здоров’я. Впевненість. Ви.')}</span>
          <AnimatedHeading as="h2">{t(title)}</AnimatedHeading>
          <p>{t(text)}</p>
        </div>
        <Link className="button button-primary" to={to}>
          <span>{t(link)}</span>
          <ArrowUpRight size={19} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
