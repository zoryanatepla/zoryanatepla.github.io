import { useI18n } from './i18n/I18n'
import { AnimatedHeading } from './motion/AnimatedHeading'
import { ArrowUpRight, Check, Heart, Instagram, Mail, MapPin, Phone, Sparkles } from 'lucide-react'
import { Link } from './i18n/I18n'
import { Action, Eyebrow, Flower, Photo, Reveal } from './components/ui'
import { AppointmentForm } from './components/AppointmentForm'
import { FAQ, Results, Reviews } from './components/Interactive'
import { site } from './data/site'
import { services, servicePath } from './data/services'
import { Encouragement, Invitation } from './components/Atmosphere'
import { journeyPath } from './data/journey'
import { DoctorPortrait } from './components/DoctorPortrait'

function Hero() {
  const { t } = useI18n()

  return (
    <section className="hero">
      <div className="container hero-layout">
        <div className="hero-copy">
          <p className="hero-promise">{t('Впевненість починається з усмішки.')}</p>
          <AnimatedHeading as="h1">
            {t('Ваша посмішка.')}
            <br />
            <span className="hero-indent">{t('Моя професійна')}</span>
            <br />
            <em>{t('турбота.')}</em>
            <Flower />
          </AnimatedHeading>
          <div className="hero-description">
            <span className="hero-description-line" />
            <p>
              <strong>{t('Зоряна Тепла')}</strong>
              {t(
                ' — лікар стоматолог-ортодонт у Києві. Понад 20 років досвіду в ортодонтичному лікуванні дітей і дорослих.',
              )}
            </p>
          </div>
          <div className="hero-actions">
            <Action to="/#appointment">{t('Записатися на консультацію')}</Action>
            <Link to="/#about" className="text-link">
              {t('Познайомитися з лікарем ')}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="hero-bottom">
            <span className="hero-bottom-icon">
              <Heart size={17} strokeWidth={1.4} aria-hidden="true" />
            </span>
            <span>
              {t('З увагою до здоров’я.')}
              <br />
              <strong>{t('З повагою до вашої індивідуальності.')}</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo-frame">
            <DoctorPortrait slot="hero" priority />
          </div>
          <div className="experience-note">
            <span className="experience-number">
              {site.doctor.experience}
              <span>{t('років')}</span>
            </span>
            <span>
              {t('досвіду, що стає')}
              <br />
              {t('вашою впевненістю')}
            </span>
            <Sparkles size={22} strokeWidth={1} aria-hidden="true" />
          </div>
          <div className="hero-photo-footer">
            <span>{t('ЗОРЯНА ТЕПЛА')}</span>
            <span>{t('ЛІКАР СТОМАТОЛОГ-ОРТОДОНТ')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustStrip() {
  const { t } = useI18n()

  return (
    <div id="trust" className="trust-strip">
      <div className="container trust-grid">
        <div>
          <span className="trust-number">{site.doctor.experience}</span>
          <span>
            {t('років професійного')}
            <br />
            {t('досвіду')}
          </span>
        </div>
        <div>
          <span className="trust-symbol">
            <Heart size={27} strokeWidth={1} />
          </span>
          <span>
            {t('Делікатна турбота')}
            <br />
            {t('про дітей і дорослих')}
          </span>
        </div>
        <div>
          <span className="trust-abbreviations">
            {t('АОУ · EOS')}
            <br />
            WFO · AAO
          </span>
          <span>
            {t('Українська та міжнародна')}
            <br />
            {t('професійна спільнота')}
          </span>
        </div>
      </div>
    </div>
  )
}

function About() {
  const { t } = useI18n()

  return (
    <section id="about" className="section about-section">
      <div className="container about-layout">
        <Reveal className="about-visual">
          <div className="about-photo-frame">
            <DoctorPortrait slot="about" />
          </div>
          <div className="about-caption">
            <span>{t('Зоряна Тепла')}</span>
            <span>{t('Лікар стоматолог-ортодонт')}</span>
          </div>
          <Flower className="about-flower" />
        </Reveal>
        <Reveal className="about-copy">
          <Eyebrow>{t('Давайте познайомимося')}</Eyebrow>
          <AnimatedHeading as="h2">
            {t('Досвід, якому')}
            <br />
            <em>{t('можна довіряти.')}</em>
          </AnimatedHeading>
          <p className="lead">
            {t(
              'За красивою посмішкою я завжди бачу людину. Її історію, очікування та індивідуальність.',
            )}
          </p>
          <p className="muted">
            {t(
              'Мене звати Зоряна Тепла. Я лікар стоматолог-ортодонт, і вже понад 20 років моя професійна діяльність присвячена здоров’ю зубощелепної системи та гармонії посмішок.',
            )}
          </p>
          <p className="muted">
            {t(
              'Працюю з дітьми та дорослими, приділяючи особливу увагу індивідуальній діагностиці та плануванню лікування. Мені важливо, щоб ви розуміли кожен крок і почувалися спокійно на цьому шляху.',
            )}
          </p>
          <Encouragement label={t('Кожна людина — особлива')}>
            {t(
              'Кожна посмішка заслуговує на індивідуальний підхід. Ваші очікування — важлива частина нашої розмови.',
            )}
          </Encouragement>
          <div className="doctor-signature">
            <span>{t('Зоряна Тепла')}</span>
            <span>{t('З турботою про вашу посмішку')}</span>
          </div>
          <Link className="text-link" to="/#approach">
            {t('Більше про мій підхід ')}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

function Associations() {
  const { t } = useI18n()

  return (
    <section className="associations-section">
      <div className="container">
        <div className="associations-heading">
          <span className="tiny-caps">{t('У професійній спільноті')}</span>
          <span>{t('Спільні цінності. Постійний розвиток.')}</span>
        </div>
        <div className="associations-grid">
          {site.associations.map((a) => (
            <Reveal className="association" key={t(a.name)}>
              <span>{t(a.name)}</span>
              <p>{t(a.description)}</p>
            </Reveal>
          ))}
        </div>
        <p className="association-note">
          {t(
            'Професійна спільнота об’єднує навколо спільного прагнення: уважної та обґрунтованої допомоги пацієнтам.',
          )}
        </p>
      </div>
    </section>
  )
}

function Services() {
  const { t } = useI18n()

  return (
    <section id="services" className="section services-section">
      <div className="container">
        <Reveal className="section-heading">
          <div>
            <Eyebrow>{t('Напрями лікування')}</Eyebrow>
            <AnimatedHeading as="h2">
              {t('Різні шляхи.')}
              <br />
              <em>{t('Одна увага до вас.')}</em>
            </AnimatedHeading>
          </div>
          <p className="muted">
            {t('Обираємо метод, який відповідає вашій клінічній ситуації, потребам і ритму життя.')}
          </p>
        </Reveal>
        <div className="services-grid">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.07}>
              <Link className="service-card" to={servicePath(s.id)}>
                <div className="service-image">
                  <Photo kind={s.image} />
                  <span className="service-image-arrow">
                    <ArrowUpRight size={21} strokeWidth={1.3} aria-hidden="true" />
                  </span>
                </div>
                <div className="service-card-copy">
                  <AnimatedHeading as="h3">{t(s.title)}</AnimatedHeading>
                  <p>{t(s.description)}</p>
                  <span className="text-link">
                    {t('Дізнатися більше ')}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        <Encouragement label={t('Гармонія в деталях')}>
          {t(
            'Естетика й здоров’я доповнюють одне одного. Почнімо з розуміння вашого прикусу, а вже потім обиратимемо метод.',
          )}
        </Encouragement>
        <p className="image-disclosure">
          {t(
            'Зображення предметів — ілюстративні. Метод лікування визначається після консультації.',
          )}
        </p>
      </div>
    </section>
  )
}

function Approach() {
  const { t } = useI18n()

  const reasons = [
    '20+ років клінічної практики',
    'Увага до функції прикусу й естетики',
    'Лікування дітей, підлітків і дорослих',
    'Індивідуальна діагностика та планування',
    'Участь у міжнародній ортодонтичній спільноті',
  ]
  return (
    <section id="approach" className="approach-section">
      <div className="container approach-layout">
        <Reveal className="approach-copy">
          <Eyebrow light>{t('Чому пацієнти обирають мене')}</Eyebrow>
          <AnimatedHeading as="h2">
            {t('Не просто рівні зуби.')}
            <br />
            <em>
              {t('Гармонія, що має')}
              <br />
              {t('значення.')}
            </em>
          </AnimatedHeading>
          <p>
            {t(
              'Я дивлюся ширше за естетику посмішки — на здоров’я, функцію та ваше самопочуття. Кожне рішення має бути обґрунтованим, а кожен крок — зрозумілим.',
            )}
          </p>
          <ul>
            {reasons.map((r) => (
              <li key={t(r)}>
                <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                {t(r)}
              </li>
            ))}
          </ul>
          <Encouragement dark label={t('У центрі уваги — ви')}>
            {t(
              'Турбота про посмішку сьогодні — внесок у ваше уважне ставлення до здоров’я в майбутньому.',
            )}
          </Encouragement>
          <Action to="/#appointment" secondary>
            {t('Почнімо зі знайомства')}
          </Action>
        </Reveal>
        <Reveal className="approach-visual">
          <DoctorPortrait slot="mentorship" />
        </Reveal>
      </div>
    </section>
  )
}

function Consultation() {
  const { t } = useI18n()

  const steps = [
    { title: t('Знайомство'), text: t('Розмовляємо про ваші очікування, скарги та побажання.') },
    {
      title: t('Уважний огляд'),
      text: t('Оцінюю положення зубів, прикус і функціональні особливості.'),
    },
    {
      title: t('Діагностика'),
      text: t('Визначаю, які обстеження потрібні саме у вашому випадку.'),
    },
    {
      title: t('Зрозумілий план'),
      text: t('Обговорюємо можливі методи лікування та наступні кроки.'),
    },
  ]
  return (
    <section className="section consultation-section">
      <div className="container">
        <Reveal className="section-heading">
          <div>
            <Eyebrow>{t('Як проходить консультація')}</Eyebrow>
            <AnimatedHeading as="h2">
              {t('Спокійно. Зрозуміло.')}
              <br />
              <em>{t('У вашому темпі.')}</em>
            </AnimatedHeading>
          </div>
          <p className="muted">
            {t(
              'Перша зустріч — це можливість познайомитися, отримати відповіді та побачити свій наступний крок.',
            )}
          </p>
        </Reveal>
        <div className="steps-grid">
          {steps.map((step, i) => (
            <Reveal key={t(step.title)} className="step" delay={i * 0.09}>
              <div className="step-line">
                <span>0{i + 1}</span>
                <span className="step-dot" />
              </div>
              <AnimatedHeading as="h3">{t(step.title)}</AnimatedHeading>
              <p>{t(step.text)}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AppointmentSection() {
  const { t } = useI18n()

  return (
    <section id="appointment" className="section appointment-section">
      <div className="container appointment-layout">
        <Reveal className="appointment-copy">
          <Eyebrow>{t('Ваш новий початок')}</Eyebrow>
          <AnimatedHeading as="h2">
            {t('Перший крок')}
            <br />
            {t('до здорової')}
            <br />
            <em>
              {t('та гармонійної')}
              <br />
              {t('посмішки.')}
            </em>
          </AnimatedHeading>
          <Encouragement label={t('Рішення без поспіху')}>
            {t(
              'Дозвольте собі поставити запитання. Перша консультація — простір для ясності та спокійного вибору.',
            )}
          </Encouragement>
          <Flower className="appointment-flower" />
        </Reveal>
        <Reveal className="form-card">
          <div className="form-heading">
            <AnimatedHeading as="h3">{t('Запис на консультацію')}</AnimatedHeading>
            <span>{t('Знайдемо зручний час для знайомства')}</span>
          </div>
          <AppointmentForm />
        </Reveal>
      </div>
    </section>
  )
}

function Contacts() {
  const { t } = useI18n()

  return (
    <section id="contacts" className="section contacts-section">
      <div className="container contacts-layout">
        <Reveal>
          <Eyebrow>{t('Будьмо на зв’язку')}</Eyebrow>
          <AnimatedHeading as="h2">
            {t('До зустрічі')}
            <br />
            <em>{t('у Києві.')}</em>
          </AnimatedHeading>
          <p className="muted">{t('Прийом у клініці Лукашука.')}</p>
          <address className="clinic-address">{t(site.contacts.address)}</address>
          <Encouragement label={t('Ми поруч із вашим рішенням')}>
            {t('Ваш шлях до гармонійної посмішки може початися з однієї розмови.')}
          </Encouragement>
          <div className="contact-details">
            {site.contacts.phone && (
              <a href={`tel:${site.contacts.phone}`}>
                <Phone size={19} strokeWidth={1.3} aria-hidden="true" />
                <span>
                  <span className="contact-label">{t('Телефон для запису')}</span>
                  {site.contacts.phoneDisplay}
                </span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            )}
            {site.contacts.instagram && (
              <a href={site.contacts.instagram} target="_blank" rel="noopener noreferrer">
                <Instagram size={20} strokeWidth={1.3} aria-hidden="true" />
                <span>
                  <span className="contact-label">Instagram</span>
                  @dr.zoryana.tepla
                </span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            )}
            <a href={`mailto:${site.contacts.email}`}>
              <Mail size={19} strokeWidth={1.3} aria-hidden="true" />
              <span>
                <span className="contact-label">{t('Електронна пошта')}</span>
                {site.contacts.email}
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </Reveal>
        <Reveal className="map-card">
          <div className="map-embed">
            <iframe
              title={t('Розташування місця прийому на Google Maps')}
              src={site.contacts.mapsEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="map-caption">
            <MapPin size={19} aria-hidden="true" />
            <div>
              <strong>{t(site.contacts.clinic)}</strong>
              <address>{t(site.contacts.address)}</address>
            </div>
            <a
              href={site.contacts.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              {t('Відкрити Google Maps ')}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function Home() {
  const { t } = useI18n()

  return (
    <>
      <Hero />
      <TrustStrip />
      <About />
      <Associations />
      <Services />
      <Approach />
      <Consultation />
      <Invitation
        title={t('Побачте свій шлях цілком.')}
        text={t(
          'Від першого знайомства до ретенції: шість етапів, які допоможуть зрозуміти лікування, підготувати запитання й відчути більше впевненості.',
        )}
        to={journeyPath}
        link={t('Ваш шлях до посмішки')}
      />
      <Results />
      <Reviews />
      <FAQ />
      <AppointmentSection />
      <Contacts />
    </>
  )
}
