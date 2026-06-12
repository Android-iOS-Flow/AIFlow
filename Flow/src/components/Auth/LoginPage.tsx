import { useState, type FormEvent } from 'react'
import { Loader2, Lock, Smartphone } from 'lucide-react'
import { useAuthStore } from '@/auth/authStore'
import { useT } from '@/i18n/useT'
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher'
import { ThemeToggle } from '../ThemeToggle/ThemeToggle'

/** Trang đăng nhập / đăng ký bằng email + mật khẩu (Supabase). Chặn toàn bộ app. */
export function LoginPage() {
  const { m } = useT()
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!email || !password) {
      setError(m.auth.missingFields)
      return
    }
    setBusy(true)
    const result =
      mode === 'signIn' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)

    if (result.error) {
      setError(result.error)
    } else if (result.needsConfirm) {
      setInfo(m.auth.confirmSent)
    }
    // Đăng nhập thành công: onAuthStateChange tự cập nhật -> App chuyển sang builder.
  }

  const isSignUp = mode === 'signUp'

  return (
    <div className="flex h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <div className="flex justify-end gap-1.5 p-3">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white">
              <Smartphone size={22} />
            </div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isSignUp ? m.auth.signUpTitle : m.auth.signInTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{m.auth.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                {m.auth.email}
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                {m.auth.password}
              </span>
              <input
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {m.auth.processing}
                </>
              ) : (
                <>
                  <Lock size={15} />
                  {isSignUp ? m.auth.signUp : m.auth.signIn}
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(isSignUp ? 'signIn' : 'signUp')
              setError(null)
              setInfo(null)
            }}
            className="mt-4 w-full text-center text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
          >
            {isSignUp ? m.auth.toSignIn : m.auth.toSignUp}
          </button>
        </div>
      </div>
    </div>
  )
}
