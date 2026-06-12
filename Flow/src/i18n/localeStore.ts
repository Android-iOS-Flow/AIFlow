import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_LOCALE, type Locale } from './types'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

/** Lưu ngôn ngữ đang chọn (ghi nhớ qua localStorage). */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'phone-flow-builder:locale' },
  ),
)
