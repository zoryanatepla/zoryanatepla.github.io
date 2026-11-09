import { treatmentResults } from './data/site'
import { BeforeAfterPair } from './components/BeforeAfterPair'
import { Action, Eyebrow, Reveal } from './components/ui'
import { AnimatedHeading } from './motion/AnimatedHeading'
import { useI18n } from './i18n/I18n'

export function ResultsPage() {
  const { t } = useI18n()
  return (
    <>
      <section className="section cases-intro">
        <div className="container">
          <Eyebrow>{t('Історії посмішок')}</Eyebrow>
          <AnimatedHeading as="h1">{t('Мої роботи')}</AnimatedHeading>
          <p className="cases-lead">
            {t('Кожна посмішка має свою історію. Фотографії до та після ортодонтичного лікування.')}
          </p>
          <p className="small-note">
            {t('Результати інших пацієнтів не є гарантією аналогічного результату лікування.')}
          </p>
        </div>
      </section>
      <section className="section cases-gallery" aria-label={t('Фотографії до та після лікування')}>
        <div className="container">
          {treatmentResults.map((result, index) => (
            <Reveal className="case-card" key={result.id}>
              <BeforeAfterPair result={result} priority={index === 0} />
            </Reveal>
          ))}
        </div>
      </section>
      <section className="section cases-appointment">
        <div className="container">
          <AnimatedHeading as="h2">{t('Почнімо з вашої історії')}</AnimatedHeading>
          <Action to="/#appointment">{t('Записатися на консультацію')}</Action>
        </div>
      </section>
    </>
  )
}
