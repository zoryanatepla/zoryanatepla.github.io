import { useEffect, useRef, useState } from 'react'
import { Copy, Send, X, ArrowUpRight } from 'lucide-react'
import { useI18n } from '../i18n/I18n'
import { site } from '../data/site'
import type { Appointment } from '../lib/form'

export function TelegramRequest({ values, onClose }: { values: Appointment; onClose: () => void }) {
  const { t } = useI18n()
  const dialog = useRef<HTMLDialogElement>(null)
  const preview = useRef<HTMLTextAreaElement>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const text = [
    t('Вітаю! Хочу записатися на консультацію.'),
    '',
    `${t('Ім’я')}: ${values.name.trim()}`,
    `${t('Номер телефону')}: ${values.phone.trim()}`,
    `${t('Для кого консультація')}: ${t(values.patient)}`,
    `${t('Напрям звернення')}: ${t(values.direction)}`,
    `${t('Коментар')}: ${values.comment.trim() || t('Не вказано')}`,
  ].join('\n')
  const telegramUrl = `https://t.me/${site.contacts.telegram}?text=${encodeURIComponent(text)}`
  useEffect(() => {
    const modal = dialog.current!
    modal.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      modal.close()
    }
  }, [])
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('copied')
    } catch {
      preview.current?.focus()
      preview.current?.select()
      setCopyState('manual')
    }
  }
  return (
    <dialog
      className="telegram-request"
      ref={dialog}
      aria-labelledby="telegram-title"
      aria-describedby="telegram-help"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'button, textarea, a[href]',
        )
        const first = controls[0],
          last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
    >
      <div className="telegram-header">
        <span className="telegram-icon">
          <Send size={23} aria-hidden="true" />
        </span>
        <div>
          <h2 id="telegram-title">{t('Заявка для Telegram')}</h2>
          <p>@{site.contacts.telegram}</p>
        </div>
        <button
          type="button"
          className="telegram-close"
          aria-label={t('Закрити вікно')}
          onClick={() => dialog.current?.close()}
        >
          <X size={22} />
        </button>
      </div>
      <div className="telegram-preview">
        <label htmlFor="telegram-text" className="sr-only">
          {t('Текст заявки')}
        </label>
        <textarea id="telegram-text" ref={preview} value={text} readOnly spellCheck={false} />
      </div>
      <div className="telegram-footer">
        <p id="telegram-help">
          {t('Перевірте заявку. У Telegram залишиться натиснути «Надіслати».')}
        </p>
        <div className="telegram-actions">
          <button type="button" className="button button-outline" onClick={copy}>
            <Copy size={17} aria-hidden="true" />
            {t(copyState === 'copied' ? 'Заявку скопійовано' : 'Скопіювати заявку')}
          </button>
          <a
            className="button button-primary"
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Send size={17} aria-hidden="true" />
            {t('Відкрити Telegram')}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
        <p role="status" className="telegram-copy-status">
          {copyState === 'manual'
            ? t('Текст виділено. Скопіюйте його вручну й вставте в чат Telegram.')
            : copyState === 'copied'
              ? t('Заявку скопійовано')
              : ''}
        </p>
      </div>
    </dialog>
  )
}
