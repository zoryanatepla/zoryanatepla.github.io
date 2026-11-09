import { useI18n } from '../i18n/I18n'
import type { TreatmentResult } from '../data/site'

export function BeforeAfterPair({
  result,
  priority = false,
}: {
  result: TreatmentResult
  priority?: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="before-after-pair">
      {(
        [
          ['До', result.before, result.beforeAlt],
          ['Після', result.after, result.afterAlt],
        ] as const
      ).map(([label, src, alt]) => (
        <figure key={label}>
          <figcaption>{t(label)}</figcaption>
          <img src={src} alt={t(alt)} loading={priority ? 'eager' : 'lazy'} decoding="async" />
        </figure>
      ))}
    </div>
  )
}
