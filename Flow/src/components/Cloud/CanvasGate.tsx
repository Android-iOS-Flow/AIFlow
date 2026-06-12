import { useEffect, useState } from 'react'
import { FileText, FolderPlus, Loader2 } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { useUiStore } from '@/store/uiStore'
import { useT } from '@/i18n/useT'
import { listMyFlows, type CloudFlowMeta } from '@/lib/cloudFlows'
import { openCloudFlow } from '@/lib/cloudActions'

/**
 * Lớp phủ khi chưa mở flow nào. Tự lấy danh sách file của user:
 *  - có file  -> hiện danh sách để mở (+ nút tạo mới/quản lý)
 *  - chưa có  -> hiện nút Tạo flow
 */
export function CanvasGate() {
  const { m } = useT()
  const cloudId = useFlowStore((s) => s.cloudId)
  const openModal = useUiStore((s) => s.openFlowsModal)
  const requestRestore = useUiStore((s) => s.requestRestore)

  const [list, setList] = useState<CloudFlowMeta[] | null>(null) // null = đang tải
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    if (cloudId) return
    setList(null)
    listMyFlows()
      .then(setList)
      .catch(() => setList([]))
  }, [cloudId])

  if (cloudId) return null

  const open = async (id: string) => {
    setOpening(true)
    try {
      await openCloudFlow(id, (d) => requestRestore(d.savedAt))
    } catch (err) {
      alert(m.cloud.error + (err as Error).message)
    } finally {
      setOpening(false)
    }
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/80 p-4 backdrop-blur-sm dark:bg-slate-950/80">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
          <FolderPlus size={24} />
        </div>

        {list === null ? (
          <div className="flex justify-center py-6">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        ) : list.length === 0 ? (
          // Chưa có file -> nút Tạo flow
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{m.cloud.gateTitle}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{m.cloud.gateHint}</p>
            <button
              onClick={openModal}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              <FolderPlus size={16} />
              {m.cloud.createNew}
            </button>
          </div>
        ) : (
          // Có file -> danh sách để mở
          <div>
            <h2 className="text-center text-base font-bold text-slate-800 dark:text-slate-100">
              {m.cloud.gateOpenTitle}
            </h2>
            <div className="mt-3 max-h-60 space-y-1 overflow-y-auto">
              {list.map((f) => (
                <button
                  key={f.id}
                  onClick={() => open(f.id)}
                  disabled={opening}
                  className="flex w-full items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50 disabled:opacity-60 dark:border-slate-700 dark:hover:border-sky-700 dark:hover:bg-sky-950"
                >
                  <FileText size={15} className="shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {f.name}
                  </span>
                  <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
                    {f.is_public ? '🌐' : '🔒'}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={openModal}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FolderPlus size={15} />
              {m.cloud.gateManage}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
