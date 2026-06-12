import { ChevronDown, FileText, Loader2 } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { useUiStore } from '@/store/uiStore'
import { useDirty } from '@/store/useDirty'
import { useT } from '@/i18n/useT'

/** Tab tên file flow đang sửa (giống VS Code) — bấm để mở popup quản lý file. */
export function FileTab() {
  const { m } = useT()
  const cloudId = useFlowStore((s) => s.cloudId)
  const cloudName = useFlowStore((s) => s.cloudName)
  const saveStatus = useFlowStore((s) => s.saveStatus)
  const openModal = useUiStore((s) => s.openFlowsModal)
  const dirty = useDirty()

  return (
    <button
      onClick={openModal}
      title={dirty ? m.cloud.unsavedHint : m.cloud.title}
      className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
    >
      <FileText size={14} className="text-slate-400" />
      {cloudId ? (
        <>
          <span className="max-w-[220px] truncate font-medium text-slate-700 dark:text-slate-200">
            {cloudName}
          </span>
          {dirty ? (
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" title={m.cloud.unsavedHint} />
          ) : saveStatus === 'saving' ? (
            <Loader2 size={12} className="animate-spin text-slate-400" />
          ) : (
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              {m.cloud.savedShort}
            </span>
          )}
        </>
      ) : (
        <span className="italic text-slate-400 dark:text-slate-500">{m.cloud.noActive}</span>
      )}
      <ChevronDown size={13} className="text-slate-400" />
    </button>
  )
}
