import { useEffect, useRef, useState } from 'react'
import {
  Download,
  FileUp,
  Globe,
  Link as LinkIcon,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { useUiStore } from '@/store/uiStore'
import { useT } from '@/i18n/useT'
import { downloadFlow, readFlowFile } from '@/lib/flowIo'
import {
  deleteCloudFlow,
  listMyFlows,
  loadCloudFlow,
  updateFlow,
  type CloudFlowMeta,
} from '@/lib/cloudFlows'
import { createCloudFlow, createCloudFlowFromDoc, openCloudFlow } from '@/lib/cloudActions'

/** Link chia sẻ tới 1 flow (mở app sẽ tự nạp flow đó). */
export function shareLink(id: string): string {
  return `${window.location.origin}${window.location.pathname}?flow=${id}`
}

/** Popup quản lý file flow trên cloud: tạo mới / nhập / mở / chia sẻ / xoá. */
export function FlowsModal() {
  const { m } = useT()
  const open = useUiStore((s) => s.flowsModalOpen)
  const close = useUiStore((s) => s.closeFlowsModal)
  const requestRestore = useUiStore((s) => s.requestRestore)
  const cloudId = useFlowStore((s) => s.cloudId)
  const fileRef = useRef<HTMLInputElement>(null)

  const [list, setList] = useState<CloudFlowMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    try {
      setList(await listMyFlows())
    } catch (err) {
      alert(m.cloud.error + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setName('')
      refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const guard = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      alert(m.cloud.error + (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleCreate = () =>
    guard(async () => {
      if (!name.trim()) return alert(m.cloud.needName)
      await createCloudFlow(name.trim())
      close()
    })

  const handleImport = (file: File) =>
    guard(async () => {
      const doc = await readFlowFile(file)
      const base = file.name.replace(/\.json$/i, '') || 'imported'
      await createCloudFlowFromDoc(base, doc)
      close()
    })

  const handleOpen = (meta: CloudFlowMeta) =>
    guard(async () => {
      await openCloudFlow(meta.id, (draft) => requestRestore(draft.savedAt))
      close()
    })

  const handleDownload = (meta: CloudFlowMeta) =>
    guard(async () => {
      const { document } = await loadCloudFlow(meta.id)
      downloadFlow(document.nodes, document.edges, document.globals ?? [], `${meta.name}.json`)
    })

  const togglePublic = (meta: CloudFlowMeta) =>
    guard(async () => {
      await updateFlow(meta.id, { is_public: !meta.is_public })
      await refresh()
    })

  const copyLink = async (id: string) => {
    await navigator.clipboard.writeText(shareLink(id))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleDelete = (meta: CloudFlowMeta) =>
    guard(async () => {
      if (!confirm(m.cloud.deleteConfirm)) return
      await deleteCloudFlow(meta.id)
      await refresh()
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{m.cloud.title}</h2>
          <button onClick={close} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        {/* Tạo mới / nhập file */}
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex gap-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={m.cloud.namePlaceholder}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="input flex-1"
            />
            <button
              onClick={handleCreate}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
            >
              <Plus size={14} />
              {m.cloud.createNew}
            </button>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            <FileUp size={13} />
            {m.cloud.importFile}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
              e.target.value = ''
            }}
          />
        </div>

        {/* Danh sách */}
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {m.cloud.myFlows}
          </span>
          <button onClick={refresh} title={m.cloud.refresh} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">{m.cloud.empty}</p>
          ) : (
            list.map((f) => (
              <div
                key={f.id}
                className={`rounded-md border px-2.5 py-2 ${
                  f.id === cloudId
                    ? 'border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => handleOpen(f)} className="min-w-0 flex-1 text-left" title={m.cloud.open}>
                    <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {f.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {f.is_public ? `🌐 ${m.cloud.publicTag}` : `🔒 ${m.cloud.privateTag}`} ·{' '}
                      {new Date(f.updated_at).toLocaleDateString()}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={() => togglePublic(f)}
                      title={f.is_public ? m.cloud.makePrivate : m.cloud.makePublic}
                      className={`rounded p-1 transition ${
                        f.is_public
                          ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {f.is_public ? <Globe size={14} /> : <Lock size={14} />}
                    </button>
                    <button
                      onClick={() => copyLink(f.id)}
                      title={copiedId === f.id ? m.cloud.linkCopied : m.cloud.copyLink}
                      className="rounded p-1 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <LinkIcon size={14} className={copiedId === f.id ? 'text-emerald-600' : ''} />
                    </button>
                    <button
                      onClick={() => handleDownload(f)}
                      title={m.toolbar.export}
                      className="rounded p-1 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(f)}
                      title={m.cloud.delete}
                      className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
