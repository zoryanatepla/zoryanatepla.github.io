export type Appointment = {
  name: string
  phone: string
  patient: string
  direction: string
  comment: string
  consent: boolean
  website: string
}
export type FieldErrors = Partial<Record<keyof Appointment, string>>
export function validateAppointment(values: Appointment): FieldErrors {
  const errors: FieldErrors = {}
  if (values.name.trim().length < 2 || values.name.trim().length > 80)
    errors.name = 'Вкажіть ім’я: від 2 до 80 символів.'
  const digits = values.phone.replace(/\D/g, '')
  if (!/^\+?[\d\s()\-]+$/.test(values.phone.trim()) || digits.length < 10 || digits.length > 15)
    errors.phone = 'Вкажіть коректний номер телефону: від 10 до 15 цифр.'
  if (!['Дорослий', 'Дитина'].includes(values.patient))
    errors.patient = 'Оберіть, для кого потрібна консультація.'
  if (!values.direction) errors.direction = 'Оберіть напрям звернення.'
  if (values.comment.length > 500) errors.comment = 'Будь ласка, обмежте коментар 500 символами.'
  if (!values.consent) errors.consent = 'Для надсилання потрібна ваша згода.'
  return errors
}
