import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/auth/authStore'
import { useT } from '@/i18n/useT'

/** Hiển thị email người dùng + nút đăng xuất trên thanh công cụ. */
export function UserMenu() {
  const { m } = useT()
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  if (!user) return null

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="hidden max-w-[160px] truncate text-xs font-medium text-slate-500 md:inline dark:text-slate-400"
        title={user.email ?? ''}
      >
        {user.email}
      </span>
      <button
        onClick={signOut}
        title={m.auth.signOut}
        className="flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-950 dark:hover:text-rose-400"
      >
        <LogOut size={16} />
      </button>
    </div>
  )
}
