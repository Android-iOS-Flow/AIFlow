import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/theme/themeStore'
import { useT } from '@/i18n/useT'

/** Nút chuyển sáng/tối trên thanh công cụ. */
export function ThemeToggle() {
  const { m } = useT()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? m.theme.light : m.theme.dark}
      className="flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
