import { useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import { useI18n } from '../i18n/I18n'
import type { ResultFraming, TreatmentResult } from '../data/site'

function imageFraming(frame: ResultFraming): CSSProperties {
  return {
    width: `${frame.scale * 100}%`,
    transform: `translate(-${frame.x}%, -${frame.y}%)`,
  }
}

export function BeforeAfterPair({
  result,
  priority = false,
}: {
  result: TreatmentResult
  priority?: boolean
}) {
  const { t } = useI18n()
  const [amount, setAmount] = useState(50)
  function move(event: PointerEvent<HTMLInputElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    setAmount(
      Math.round(Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))),
    )
  }
  return (
    <>
      <div className="comparison has-result before-after-pair">
        <div className="comparison-before" style={{ clipPath: `inset(0 ${100 - amount}% 0 0)` }}>
          <img
            src={result.before}
            style={imageFraming(result.framing.before)}
            alt={t(result.beforeAlt)}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
          />
        </div>
        <div className="comparison-after">
          <img
            src={result.after}
            style={imageFraming(result.framing.after)}
            alt={t(result.afterAlt)}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
          />
        </div>
        <span className="comparison-label before-label">{t('До')}</span>
        <span className="comparison-label after-label">{t('Після')}</span>
        <div className="comparison-divider" style={{ left: `${amount}%` }} aria-hidden="true">
          <span>
            <ChevronsLeftRight size={20} />
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          onPointerDown={(event) => {
            if (event.button !== 0) return
            event.preventDefault()
            event.currentTarget.focus({ preventScroll: true })
            event.currentTarget.setPointerCapture(event.pointerId)
            move(event)
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event)
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              move(event)
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
          }}
          onPointerCancel={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId)
          }}
          aria-label={t('Порівняння до та після')}
          aria-valuetext={`${amount}${t('% зображення до лікування')}`}
          className="comparison-range"
        />
      </div>
      <p className="comparison-hint">{t('Потягніть, щоб порівняти ')}</p>
    </>
  )
}
