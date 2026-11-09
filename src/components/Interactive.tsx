import { useI18n } from '../i18n/I18n'
import { AnimatedHeading } from '../motion/AnimatedHeading'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, Plus, Quote } from 'lucide-react'
import { faq, reviews, featuredResult } from '../data/site'
import { Action, Eyebrow, Reveal } from './ui'
import { silk } from '../motion/presets'
import { Encouragement } from './Atmosphere'
import { BeforeAfterPair } from './BeforeAfterPair'

export function FAQ() {
  const { t } = useI18n()

  const [open, setOpen] = useState<number | null>(0)
  const reduced = useReducedMotion()
  return (
    <section id="faq" className="section faq-section">
      <div className="container faq-layout">
        <Reveal>
          <Eyebrow>{t('Відповіді на ваші запитання')}</Eyebrow>
          <AnimatedHeading as="h2">
            {t('Більше ясності.')}
            <br />
            <em>{t('Менше хвилювань.')}</em>
          </AnimatedHeading>
          <p className="muted faq-intro">
            {t(
              'Усе починається з розмови. Зібрала відповіді на запитання, які найчастіше виникають перед першою зустріччю.',
            )}
          </p>
          <Encouragement label={t('Запитувати — природно')}>
            {t(
              'Розуміння допомагає приймати зважені рішення. Для важливих запитань завжди є місце.',
            )}
          </Encouragement>
        </Reveal>
        <div className="faq-list">
          {faq.map((item, i) => (
            <div className={`faq-item ${open === i ? 'is-open' : ''}`} key={t(item.question)}>
              <AnimatedHeading as="h3">
                <button
                  id={`faq-button-${i}`}
                  aria-expanded={open === i}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span>{t(item.question)}</span>
                  <Plus size={18} aria-hidden="true" />
                </button>
              </AnimatedHeading>
              <motion.div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-button-${i}`}
                initial={false}
                animate={{
                  gridTemplateRows: open === i ? '1fr' : '0fr',
                  visibility: open === i ? 'visible' : 'hidden',
                }}
                transition={{ duration: reduced ? 0 : 0.55, ease: silk.ease }}
                className="faq-answer"
              >
                <div>
                  <p>{t(item.answer)}</p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Results() {
  const { t } = useI18n()
  return (
    <section id="results" className="section results-section">
      <div className="container">
        <Reveal className="section-heading">
          <div>
            <Eyebrow>{t('Результати лікування')}</Eyebrow>
            <AnimatedHeading as="h2">
              {t('За кожною посмішкою —')}
              <br />
              <em>{t('особиста історія.')}</em>
            </AnimatedHeading>
          </div>
          <Action to="/do-pislia/">{t('Переглянути всі роботи')}</Action>
        </Reveal>
        <Reveal className="case-card featured-case">
          <BeforeAfterPair result={featuredResult} />
        </Reveal>
        <p className="small-note">
          {t('Результати інших пацієнтів не є гарантією аналогічного результату лікування.')}
        </p>
      </div>
    </section>
  )
}

export function Reviews() {
  const { t } = useI18n()

  const [index, setIndex] = useState(0)
  const reduced = useReducedMotion()
  const review = reviews[index]
  return (
    <section className="reviews-section section">
      <div className="container">
        <Eyebrow>{t('Відгуки пацієнтів')}</Eyebrow>
        <div className="reviews-layout">
          <AnimatedHeading as="h2">
            {t('Найцінніше —')}
            <br />
            <em>{t('ваша довіра.')}</em>
          </AnimatedHeading>
          <Reveal className="review-content">
            <Quote className="quote-icon" size={38} strokeWidth={1} aria-hidden="true" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={review?.id || 'empty'}
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.25 }}
              >
                {review ? (
                  <>
                    <blockquote>{review.text}</blockquote>
                    <p className="review-author">
                      {review.name}
                      {review.date && <span>{review.date}</span>}
                    </p>
                    {review.sourceUrl && (
                      <a
                        className="text-link"
                        href={review.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('Переглянути джерело ')}
                        <ArrowRight size={15} />
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <blockquote>{t('Довіра починається з чесності.')}</blockquote>
                    <p className="muted">
                      {t(
                        'Тут будуть ваші справжні відгуки. Публікуватиму їх лише з дозволу пацієнтів — зі збереженням ваших слів і вашої приватності.',
                      )}
                    </p>
                    <span className="tiny-caps review-empty-label">
                      {t('Перші історії — незабаром')}
                    </span>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            {reviews.length > 1 && (
              <div className="carousel-controls">
                <button
                  className="round-button"
                  aria-label={t('Попередній відгук')}
                  onClick={() => setIndex((index - 1 + reviews.length) % reviews.length)}
                >
                  <ArrowLeft size={18} />
                </button>
                <span aria-live="polite">
                  {index + 1} / {reviews.length}
                </span>
                <button
                  className="round-button"
                  aria-label={t('Наступний відгук')}
                  onClick={() => setIndex((index + 1) % reviews.length)}
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
