/** Các ngôn ngữ hỗ trợ. Mặc định là 'en' (tiếng Anh), phụ là 'vi' (tiếng Việt). */
export type Locale = 'en' | 'vi'

export const LOCALES: Locale[] = ['en', 'vi']

export const DEFAULT_LOCALE: Locale = 'en'

/** Nhãn hiển thị của từng ngôn ngữ trong bộ chuyển đổi. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
}

/**
 * Một chuỗi đa ngôn ngữ. Dùng trong config node để giữ nguyên tắc
 * "1 node = 1 file": text song ngữ nằm ngay trong file của node đó.
 */
export type LocalizedText = Record<Locale, string>
