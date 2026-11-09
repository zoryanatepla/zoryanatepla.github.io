import { languageForPath, withoutLanguage, localizedPath, translate } from './locale'
import { site } from '../data/site'
import { services, servicePath } from '../data/services'

function ukrainianSeo(path: string) {
  if (path.replace(/\/$/, '') === '/do-pislia')
    return {
      title: 'Мої роботи — до та після лікування | Зоряна Тепла',
      description:
        'Фотографії до та після ортодонтичного лікування. Роботи лікаря стоматолога-ортодонта Зоряни Теплої, Київ.',
      path: '/do-pislia/',
    }

  if (path.replace(/\/$/, '') === '/mentorstvo')
    return {
      title: 'Менторство для стоматологів та ортодонтів | Зоряна Тепла',
      description:
        'Можливості професійного менторства із Зоряною Теплою: клінічне мислення, діагностика та планування ортодонтичного лікування. Формат і доступність — за погодженням.',
      path: '/mentorstvo/',
    }
  if (path.replace(/\/$/, '') === '/vash-shliakh-do-posmishky')
    return {
      title: 'Ваш шлях до посмішки — етапи лікування | Зоряна Тепла',
      description:
        'Як проходить ортодонтичне лікування: консультація, діагностика, індивідуальний план, вибір апарата, контроль і ретенція. Ортодонт Зоряна Тепла, Київ.',
      path: '/vash-shliakh-do-posmishky/',
    }
  const service = services.find(
    (s) => path.replace(/\/$/, '') === servicePath(s.id).replace(/\/$/, ''),
  )
  if (service)
    return {
      title: service.seoTitle,
      description: service.seoDescription,
      path: servicePath(service.id),
    }
  if (path.startsWith('/polityka-konfidentsiinosti'))
    return {
      title: 'Політика конфіденційності — Зоряна Тепла',
      description:
        'Які дані збирає форма запису, для чого вони потрібні та як обробляються звернення на сайті лікаря Зоряни Теплої.',
      path: '/polityka-konfidentsiinosti/',
    }
  if (path !== '/')
    return {
      title: 'Сторінку не знайдено — Зоряна Тепла',
      description: 'Поверніться на головну сторінку лікаря стоматолога-ортодонта Зоряни Теплої.',
      path,
      noindex: true,
    }
  return {
    title: 'Ортодонт у Києві — Зоряна Тепла | Брекети та елайнери',
    description:
      'Зоряна Тепла — стоматолог-ортодонт у Києві. 20+ років досвіду. Ортодонтичне лікування дітей і дорослих, брекети, елайнери та діагностика прикусу.',
    path: '/',
  }
}

export function seoForPath(path: string) {
  const language = languageForPath(path)
  const clean = withoutLanguage(path)
  const seo = ukrainianSeo(clean)
  return {
    ...seo,
    title: translate(seo.title, language),
    description: translate(seo.description, language),
    path: localizedPath(seo.path, language),
  }
}

export function schemaForPath(path: string) {
  const language = languageForPath(path)
  const t = (text: string) => translate(text, language)
  const seo = seoForPath(path)
  const homeUrl = publicUrl('/')
  const url = publicUrl(seo.path)
  const doctorId = homeUrl ? `${homeUrl}#doctor` : undefined
  const doctor = {
    '@type': 'Physician',
    '@id': doctorId,
    name: t(site.doctor.fullName),
    alternateName: t(site.doctor.name),
    url: publicUrl(localizedPath('/', language)),
    description: t(site.doctor.role),
    medicalSpecialty: 'Dentistry',
    telephone: site.contacts.phone,
    email: site.contacts.email,
    image: publicUrl('/images/zoryana-tepla-hero.webp'),
    logo: publicUrl('/favicon-zt-512.png'),
    sameAs: [site.contacts.instagram],
    areaServed: { '@type': 'City', name: t(site.doctor.city) },
    address: {
      '@type': 'PostalAddress',
      streetAddress: t('вулиця Юлії Здановської, 58А'),
      addressLocality: t(site.doctor.city),
      postalCode: '03191',
      addressCountry: 'UA',
    },
    location: { '@type': 'MedicalClinic', name: t(site.contacts.clinic) },
    hasMap: site.contacts.mapsUrl,
    memberOf: site.associations.map((a) => ({ '@type': 'Organization', name: t(a.description) })),
  }
  const page = {
    '@type': 'WebPage',
    '@id': url ? `${url}#webpage` : undefined,
    url,
    name: seo.title,
    description: seo.description,
    inLanguage: language,
    isPartOf: {
      '@type': 'WebSite',
      '@id': homeUrl ? `${homeUrl}#website` : undefined,
      url: homeUrl,
      name: t(site.doctor.name),
      inLanguage: ['uk', 'en'],
      publisher: doctorId ? { '@id': doctorId } : doctor,
    },
    ...(withoutLanguage(path) !== '/'
      ? {
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: t('Головна'),
                item: publicUrl(localizedPath('/', language)),
              },
              { '@type': 'ListItem', position: 2, name: seo.title, item: url },
            ],
          },
        }
      : {}),
  }
  if (withoutLanguage(path) === '/')
    return { '@context': 'https://schema.org', ...doctor, mainEntityOfPage: page }
  const service = services.find((entry) => servicePath(entry.id) === withoutLanguage(seo.path))
  if (service)
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': url ? `${url}#service` : undefined,
      url,
      name: t(service.title),
      serviceType: t(service.title),
      description: t(service.description),
      areaServed: doctor.areaServed,
      provider: doctor,
      mainEntityOfPage: page,
    }
  return { '@context': 'https://schema.org', ...page, about: doctor }
}
export const schema = schemaForPath('/')

export function publicUrl(path: string) {
  const origin = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '')
  return origin ? `${origin}${import.meta.env.BASE_URL}${path.replace(/^\//, '')}` : undefined
}
