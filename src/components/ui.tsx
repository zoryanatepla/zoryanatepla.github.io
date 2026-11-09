import { useI18n } from '../i18n/I18n'
import type { ReactNode } from 'react'
import { ArrowUpRight, Asterisk } from 'lucide-react'
import { Link } from '../i18n/I18n'
import { Monogram } from './Monogram'

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const content = (
    <div className={`reveal-block ${className}`} data-motion-reveal="true" data-delay={delay}>
      {children}
    </div>
  )
  const surface =
    /(?:^|\s)(form-card|map-card|mentorship-card|mentorship-topic|mentorship-stage|journey-summary|preparation-card|comparison-wrap|case-card|review-content|service-note|encouragement|step|journey-explorer|association|mentorship-visual|journey-art|approach-visual)(?:\s|$)/.test(
      className,
    )
  return surface ? (
    <div
      className={`motion-anchor ${className.split(/\s+/).includes('map-card') ? 'motion-map-anchor' : ''}`}
      data-motion-anchor="true"
    >
      {content}
    </div>
  ) : (
    content
  )
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div className={`eyebrow ${light ? 'eyebrow-light' : ''}`}>
      <span className="eyebrow-line" />
      {children}
    </div>
  )
}

export function Action({
  children,
  to,
  secondary = false,
  className = '',
}: {
  children: ReactNode
  to: string
  secondary?: boolean
  className?: string
}) {
  return (
    <Link
      to={to}
      className={`button ${secondary ? 'button-outline' : 'button-primary'} ${className}`}
    >
      <span>{children}</span>
      <ArrowUpRight size={18} aria-hidden="true" />
    </Link>
  )
}

export function Brand({ footer = false }: { footer?: boolean }) {
  const { t } = useI18n()
  return (
    <Link to="/" className={`brand ${footer ? 'brand-footer' : ''}`}>
      <Monogram className="brand-symbol" />
      <span className="brand-type">
        {t('Зоряна Тепла')}
        <span>{t('ЛІКАР СТОМАТОЛОГ-ОРТОДОНТ')}</span>
      </span>
    </Link>
  )
}

export function Photo({
  kind,
  className = '',
  label,
  priority = false,
}: {
  kind: string
  className?: string
  label?: string
  priority?: boolean
}) {
  const { t } = useI18n()
  return (
    <div
      className={`motion-anchor motion-image-anchor ${className.includes('service-page-photo') ? 'motion-service-anchor' : ''}`}
      data-motion-anchor="true"
    >
      <div
        className={`editorial-photo photo-${kind} ${className}`}
        role="img"
        aria-label={
          label ||
          {
            braces: t('Ілюстративне зображення навчальної моделі з брекетами'),
            aligners: t('Ілюстративне зображення прозорих елайнерів'),
            children: t('Ілюстративний натюрморт: дерев’яна іграшка та шавлієва ваза'),
            balance: t('Ілюстративна скульптура як символ гармонії та балансу'),
            gnathology: t('Ілюстративна модель щелеп і щелепного суглоба'),
          }[kind] ||
          t('Декоративне зображення')
        }
      >
        <img
          src={`${import.meta.env.BASE_URL}images/${kind === 'gnathology' ? 'gnathology-model.webp' : 'editorial-still-life.webp'}`}
          alt=""
          aria-hidden="true"
          width={kind === 'gnathology' ? 1200 : 1774}
          height={kind === 'gnathology' ? 800 : 887}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </div>
    </div>
  )
}

export function Flower({ className = '' }: { className?: string }) {
  return <Asterisk className={`flower ${className}`} strokeWidth={0.6} aria-hidden="true" />
}
