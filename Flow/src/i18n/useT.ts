import { useLocaleStore } from './localeStore'
import { messages } from './messages'
import type { LocalizedText } from './types'

/**
 * Hook i18n chính.
 * - `locale`: ngôn ngữ hiện tại
 * - `m`: bộ chuỗi giao diện theo ngôn ngữ
 * - `tr(text)`: lấy chuỗi đúng ngôn ngữ từ một LocalizedText (fallback tiếng Anh)
 */
export function useT() {
  const locale = useLocaleStore((s) => s.locale)
  const m = messages[locale]
  const tr = (text: LocalizedText): string => text[locale] ?? text.en
  return { locale, m, tr }
}
