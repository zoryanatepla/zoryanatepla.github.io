export const site = {
  doctor: {
    name: 'Зоряна Тепла',
    fullName: 'Тепла Зоряна Миколаївна',
    role: 'Лікар стоматолог-ортодонт',
    experience: '20+',
    city: 'Київ',
    portraits: {
      journey: {
        src: `${import.meta.env.BASE_URL}images/zoryana-tepla-journey.webp`,
        width: 942,
        height: 1280,
      },
      hero: {
        src: `${import.meta.env.BASE_URL}images/zoryana-tepla-hero.webp`,
        width: 960,
        height: 1826,
      },
      about: {
        src: `${import.meta.env.BASE_URL}images/zoryana-tepla-about.webp`,
        width: 960,
        height: 1202,
      },
      mentorship: {
        src: `${import.meta.env.BASE_URL}images/zoryana-tepla-mentorship.webp`,
        width: 957,
        height: 1280,
      },
    },
    portraitAlt: 'Зоряна Тепла — лікар стоматолог-ортодонт',
  },
  // Populate only with confirmed, public contact details. Empty values are never rendered as links.
  contacts: {
    phone: '+380679404225',
    email: 'orthodentua@gmail.com',
    phoneDisplay: '+38 (067) 940 42 25',
    clinic: 'Клініка Лукашука',
    address: 'вулиця Юлії Здановської, 58А, Київ, 03191',
    schedule: '',
    instagram: 'https://www.instagram.com/dr.zoryana.tepla',
    mapsEmbed: `https://www.google.com/maps?q=${encodeURIComponent('вулиця Юлії Здановської, 58А, Київ, 03191')}&z=16&output=embed`,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('вулиця Юлії Здановської, 58А, Київ, 03191')}`,
  },
  // Public Formspree address. An explicit empty override disables online booking.
  formEndpoint: import.meta.env.VITE_FORMSPREE_ENDPOINT ?? 'https://formspree.io/f/xwllyzab',
  associations: [
    { name: 'АОУ', description: 'Асоціація ортодонтів України' },
    { name: 'EOS', description: 'European Orthodontic Society' },
    { name: 'WFO', description: 'World Federation of Orthodontists' },
    { name: 'AAO', description: 'American Association of Orthodontists' },
  ],
}

export const faq = [
  {
    question: 'Коли дитині варто вперше звернутися до ортодонта?',
    answer:
      'Перший профілактичний огляд зазвичай рекомендують приблизно у 7 років, коли починається зміна молочних зубів. Якщо ви помітили труднощі з жуванням, виражену асиметрію, ротове дихання чи інші особливості — варто звернутися раніше. Огляд не завжди означає початок лікування: іноді достатньо спостереження.',
  },
  {
    question: 'Чим відрізняються елайнери від брекетів?',
    answer:
      'Брекети — незнімна система, а елайнери — знімні прозорі капи, які послідовно змінюють. Елайнери потребують дисципліни та носіння за призначеним режимом. Вибір залежить від особливостей прикусу, складності переміщень, стану зубів і ваших можливостей. Обидва методи потребують діагностики та контролю лікаря.',
  },
  {
    question: 'Чи можна виправити прикус у дорослому віці?',
    answer:
      'Ортодонтичне лікування можливе й у дорослому віці. Важливі стан зубів, ясен, кісткової тканини та загальне здоров’я. У деяких випадках потрібна співпраця з іншими спеціалістами. Показання, обмеження й очікувані зміни визначаємо індивідуально після обстеження.',
  },
  {
    question: 'Скільки триває ортодонтичне лікування?',
    answer:
      'Тривалість залежить від діагнозу, віку, складності випадку, обраного методу та дотримання рекомендацій. Попередній термін можна обговорити після діагностики; у процесі лікування він може змінюватися. Після активного етапу зазвичай потрібна ретенція — утримання досягнутого положення зубів.',
  },
  {
    question: 'Чи потрібно робити діагностику перед лікуванням?',
    answer:
      'Так. Огляд, аналіз фотографій і цифрових моделей або відбитків допомагають скласти план. Рентгенологічні та інші дослідження призначаються лише за клінічними показаннями. Не потрібно самостійно робити КТ чи інші знімки до консультації — лікар визначить необхідний обсяг.',
  },
  {
    question: 'Коли потрібна консультація з питань роботи щелепного суглоба?',
    answer:
      'Якщо рухи щелепи стали незручними або з’явився біль, варто обговорити це з лікарем. На консультації ви зможете описати свої відчуття, а лікар — оцінити роботу суглоба та жувальних м’язів. Після огляду стане зрозуміло, чи потрібні додаткові обстеження та який наступний крок буде доречним саме для вас.',
  },
]

// Add only genuine, approved patient testimonials. No ratings are inferred.
export type Review = { id: string; name: string; text: string; date?: string; sourceUrl?: string }
export const reviews: Review[] = []
// Add only genuine photos with explicit patient consent and clinically reviewed captions.
export type TreatmentResult = {
  id: string
  title: string
  description: string
  before: string
  after: string
  beforeAlt: string
  afterAlt: string
}
// User-supplied originals in order: 01–02, 03–04, 05–06, 07–08.
export const treatmentResults: TreatmentResult[] = Array.from({ length: 4 }, (_, index) => ({
  id: `case-${index + 1}`,
  title: 'Ортодонтичне лікування',
  description: '',
  before: `${import.meta.env.BASE_URL}images/results/${String(index * 2 + 1).padStart(2, '0')}.webp`,
  after: `${import.meta.env.BASE_URL}images/results/${String(index * 2 + 2).padStart(2, '0')}.webp`,
  beforeAlt: 'Фото зубів до ортодонтичного лікування',
  afterAlt: 'Фото зубів після ортодонтичного лікування',
}))
export const featuredResult = treatmentResults[2]
