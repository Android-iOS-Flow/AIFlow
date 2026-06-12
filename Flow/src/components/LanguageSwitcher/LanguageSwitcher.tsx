import { Languages } from 'lucide-react'
import { useLocaleStore } from '@/i18n/localeStore'
import { LOCALES, LOCALE_LABELS } from '@/i18n/types'
import { useT } from '@/i18n/useT'

/** Nút chuyển ngôn ngữ (EN / VI) ở thanh công cụ. */
export function LanguageSwitcher() {
  const { m } = useT()
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)

  return (
    <div
      className="flex items-center gap-1 rounded-md border border-slate-200 p-0.5 dark:border-slate-700"
      title={m.language.label}
    >
      <Languages size={15} className="ml-1 text-slate-400 dark:text-slate-500" />
      {LOCALES.map((code) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={`rounded px-2 py-1 text-xs font-semibold uppercase transition ${
            locale === code
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
          title={LOCALE_LABELS[code]}
        >
          {code}
        </button>
      ))}
    </div>
  )
}
