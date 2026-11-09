import { useI18n } from './i18n/I18n'
import { Link } from './i18n/I18n'
import { AnimatedHeading } from './motion/AnimatedHeading'
import { ArrowLeft, ArrowUpRight, Check, Phone } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { services, servicePath } from './data/services'
import { site } from './data/site'
import { Action, Eyebrow, Photo, Reveal } from './components/ui'
import { AppointmentSection } from './Home'
import { Encouragement, Invitation } from './components/Atmosphere'
import { journeyPath, serviceEncouragement } from './data/journey'

export function ServicePage() {
  const { t } = useI18n()

  const { id } = useParams()
  const service = services.find((s) => s.id === id)
  if (!service) return <NotFound />
  return (
    <>
      <section className="service-hero section">
        <div className="container">
          <Link className="back-link" to="/#services">
            <ArrowLeft size={15} />
            {t('Усі напрями лікування')}
          </Link>
          <div className="service-hero-layout">
            <Reveal>
              <Eyebrow>{t('Ортодонтія з увагою до вас · Київ')}</Eyebrow>
              <AnimatedHeading as="h1">{t(service.title)}</AnimatedHeading>
              <p className="service-subtitle">{t(service.subtitle)}</p>
              <p className="muted">{t(service.intro)}</p>
              <Encouragement label={t('Ваше рішення має значення')}>
                {t(serviceEncouragement[service.id])}
              </Encouragement>
              <Action to="/#appointment">{t('Записатися на консультацію')}</Action>
            </Reveal>
            <Photo kind={service.image} className="service-page-photo" priority />
          </div>
        </div>
      </section>
      <section className="section service-details">
        <div className="container service-detail-layout">
          <div>
            <Eyebrow>{t('Індивідуальний підхід')}</Eyebrow>
            <AnimatedHeading as="h2">
              {t('Рішення починається')}
              <br />
              <em>{t('з діагностики.')}</em>
            </AnimatedHeading>
          </div>
          <div>
            <AnimatedHeading as="h3">{t('Що варто знати')}</AnimatedHeading>
            <ul>
              {service.details.map((detail) => (
                <li key={t(detail)}>
                  <Check size={18} aria-hidden="true" />
                  <p>{t(detail)}</p>
                </li>
              ))}
            </ul>
            <Reveal className="service-note">
              <AnimatedHeading as="h3">{t('Важливі деталі')}</AnimatedHeading>
              <p>{t(service.note)}</p>
            </Reveal>
            <p className="muted">
              {t(
                'Тривалість і вартість лікування можна визначити після діагностики та узгодження індивідуального плану. Інформація на сторінці не замінює особистої консультації.',
              )}
            </p>
          </div>
        </div>
      </section>
      <section className="section preparation-section">
        <div className="container">
          <Eyebrow>{t('До першої зустрічі')}</Eyebrow>
          <AnimatedHeading as="h2">
            {t('Трохи підготовки.')}
            <br />
            <em>{t('Більше спокою.')}</em>
          </AnimatedHeading>
          <div className="preparation-grid">
            {[
              {
                title: t('Розкажіть про важливе'),
                text: t(
                  'Що саме ви хотіли б змінити? Які відчуття турбують? Сформулюйте свої очікування — вони допоможуть зробити розмову предметною.',
                ),
              },
              {
                title: t('Візьміть те, що вже є'),
                text: t(
                  'Наявні знімки та попередні висновки можуть бути корисними. Самостійно проходити нові обстеження до консультації не потрібно.',
                ),
              },
              {
                title: t('Залиште місце для запитань'),
                text: t(
                  'Запишіть, що хотіли б з’ясувати про методи, догляд, контрольні візити та ретенцію. Розуміти свій план так само важливо, як дотримуватися його.',
                ),
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1} className="preparation-card">
                <span>0{i + 1}</span>
                <AnimatedHeading as="h3">{item.title}</AnimatedHeading>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <Invitation
        title={t('Спочатку розуміння. Потім — ваш наступний крок.')}
        text={t(
          'Познайомтеся з усіма етапами ортодонтичного лікування, щоб побачити не лише метод, а й цілісний підхід до вашого здоров’я.',
        )}
        to={journeyPath}
        link={t('Дослідити шлях до посмішки')}
      />
      <section className="section more-services">
        <div className="container">
          <Eyebrow>{t('Дізнайтеся більше')}</Eyebrow>
          <AnimatedHeading as="h2">
            {t('Інші ')}
            <em>{t('напрями.')}</em>
          </AnimatedHeading>
          <div className="more-service-links">
            {services
              .filter((s) => s.id !== service.id)
              .map((s) => (
                <Link key={s.id} to={servicePath(s.id)}>
                  <span>{s.number}</span>
                  {t(s.title)}
                  <ArrowUpRight size={20} />
                </Link>
              ))}
          </div>
        </div>
      </section>
      <AppointmentSection />
    </>
  )
}

export function PrivacyPage() {
  const { t } = useI18n()

  return (
    <article className="section legal-page">
      <div className="container legal-container">
        <Link className="back-link" to="/">
          <ArrowLeft size={15} />
          {t('На головну')}
        </Link>
        <Eyebrow>{t('З повагою до вашої приватності')}</Eyebrow>
        <AnimatedHeading as="h1">
          {t('Політика')}
          <br />
          <em>{t('конфіденційності.')}</em>
        </AnimatedHeading>
        <p className="muted">{t('Оновлено 5 листопада 2026 року')}</p>
        <div className="legal-content">
          <p>
            {t(
              'Цей сайт представляє лікаря стоматолога-ортодонта Теплу Зоряну Миколаївну у Києві. Політика пояснює, як сайт працює з контактними даними відвідувачів.',
            )}
          </p>
          <AnimatedHeading as="h2">{t('Які дані запитуємо')}</AnimatedHeading>
          <p>
            {t(
              'Форма консультації запитує ім’я, номер телефону, для кого потрібна консультація (дитина або дорослий), напрям звернення, необов’язковий короткий коментар та згоду на обробку даних. Не вказуйте діагнози, медичні документи, відомості про здоров’я, ім’я чи інші персональні дані дитини. Для запису дитини контактні дані залишає її законний представник.',
            )}
          </p>
          <AnimatedHeading as="h2">{t('Для чого потрібні дані')}</AnimatedHeading>
          <p>
            {t(
              'Дані використовуються для відповіді на ваше звернення та узгодження консультації. Підстава — ваша добровільна згода, яку ви надаєте окремою позначкою у формі. Дані не призначені для рекламних розсилок.',
            )}
          </p>
          <AnimatedHeading as="h2">{t('Як надсилається звернення')}</AnimatedHeading>
          <p>
            {t(
              'Після заповнення форми сайт готує текст заявки у вікні попереднього перегляду. Ви можете скопіювати його або відкрити чат лікаря в Telegram із підготовленим повідомленням. Сайт не надсилає заявку автоматично: остаточне надсилання ви підтверджуєте в Telegram.',
            )}
          </p>
          <p>
            {t(
              'Після відкриття Telegram обробка даних відбувається за правилами цього сервісу. Якщо застосунок не підставив текст, скопіюйте заявку й вставте її в чат.',
            )}{' '}
            <a href="https://telegram.org/privacy" target="_blank" rel="noopener noreferrer">
              {t('Політика конфіденційності Telegram')}
            </a>
            .
          </p>
          <AnimatedHeading as="h2">{t('Зберігання і захист')}</AnimatedHeading>
          <p>
            {t(
              'Сайт не записує вміст форми в URL, localStorage, cookies чи публічні файли. Дані введення існують у пам’яті сторінки до її закриття або перезавантаження. Надіслані заявки обробляються одержувачем і сервісом доставки; доступ до них має бути обмежений, а дані видалятимуться, щойно потреба у відповіді та узгодженні консультації відпаде, з урахуванням законних вимог зберігання.',
            )}
          </p>
          <AnimatedHeading as="h2">{t('Cookies та зовнішні сервіси')}</AnimatedHeading>
          <p>
            {t(
              'На сайті немає рекламних трекерів і аналітичних cookies. Шрифти та ілюстрації завантажуються разом із сайтом. Хостинг може вести технічні журнали запитів відповідно до власної політики. Посилання на Instagram і зовнішні сервіси відкривають сторонні сайти з їхніми правилами приватності.',
            )}
          </p>
          <p>
            {t(
              'У браузері зберігається лише вибір світлої або темної теми. Мова визначається адресою сторінки. Дані форми не зберігаються у цих налаштуваннях.',
            )}
          </p>
          {site.contacts.mapsEmbed && (
            <p>
              {t(
                'На сторінці контактів вбудована карта Google Maps. Її завантаження може передавати Google технічні дані, зокрема IP-адресу; застосовується політика конфіденційності Google.',
              )}
            </p>
          )}
          <AnimatedHeading as="h2">{t('Ваші права і зв’язок')}</AnimatedHeading>
          <p>
            {t(
              'Ви можете запросити інформацію про обробку свого звернення, уточнення чи видалення даних, а також відкликати згоду. Це не впливає на правомірність попередньої обробки. Для запиту зв’яжіться з лікарем за публічним телефоном нижче. Не надсилайте у відкритих повідомленнях медичні документи.',
            )}
          </p>
          {site.contacts.phone && (
            <a className="text-link" href={`tel:${site.contacts.phone}`}>
              <Phone size={16} />
              {site.contacts.phoneDisplay}
            </a>
          )}
          <p>
            <a className="text-link" href={`mailto:${site.contacts.email}`}>
              {site.contacts.email}
            </a>
          </p>
          <AnimatedHeading as="h2">{t('Медична інформація')}</AnimatedHeading>
          <p>
            {t(
              'Матеріали сайту мають інформаційний характер і не є дистанційною діагностикою або індивідуальною медичною рекомендацією. Для визначення діагнозу й плану лікування потрібна особиста консультація.',
            )}
          </p>
        </div>
      </div>
    </article>
  )
}

export function NotFound() {
  const { t } = useI18n()

  return (
    <section className="not-found section">
      <div className="container">
        <Eyebrow>{t('404 · Сторінку не знайдено')}</Eyebrow>
        <AnimatedHeading as="h1">
          {t('Повернімося')}
          <br />
          <em>{t('до знайомства.')}</em>
        </AnimatedHeading>
        <p className="muted">
          {t('Можливо, адреса змінилася. Головна сторінка допоможе знайти потрібну інформацію.')}
        </p>
        <Action to="/">{t('На головну')}</Action>
      </div>
    </section>
  )
}
