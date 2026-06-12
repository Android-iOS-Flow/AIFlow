import { History } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useT } from '@/i18n/useT'

/** Dialog hỏi khôi phục bản nháp chưa lưu (thay cho confirm() mặc định). */
export function RestoreDraftDialog() {
  const { m } = useT()
  const restore = useUiStore((s) => s.restore)
  const answer = useUiStore((s) => s.answerRestore)

  if (!restore) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <History size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{m.cloud.restoreTitle}</h2>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">{m.cloud.restorePrompt}</p>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          {m.cloud.restoreSavedAt}: {new Date(restore.savedAt).toLocaleString()}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => answer(false)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {m.cloud.restoreNo}
          </button>
          <button
            onClick={() => answer(true)}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            {m.cloud.restoreYes}
          </button>
        </div>
      </div>
    </div>
  )
}
