import { Plus, Trash2, Variable } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { useT } from '@/i18n/useT'

/** Khu quản lý biến Global: thêm/sửa/xoá; mỗi field của node có thể tham chiếu tới. */
export function GlobalsPanel() {
  const { m } = useT()
  const globals = useFlowStore((s) => s.globals)
  const addGlobal = useFlowStore((s) => s.addGlobal)
  const updateGlobal = useFlowStore((s) => s.updateGlobal)
  const removeGlobal = useFlowStore((s) => s.removeGlobal)

  return (
    <section className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Variable size={15} className="text-slate-500 dark:text-slate-400" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{m.globals.title}</h2>
        </div>
        <button
          onClick={addGlobal}
          title={m.globals.add}
          className="flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Plus size={13} />
        </button>
      </div>

      {globals.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">{m.globals.empty}</p>
      ) : (
        <div className="space-y-1.5">
          {globals.map((g, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                value={g.name}
                onChange={(e) => updateGlobal(i, { name: e.target.value })}
                placeholder={m.globals.name}
                className="w-1/2 min-w-0 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-800 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <input
                value={String(g.value)}
                onChange={(e) => updateGlobal(i, { value: e.target.value })}
                placeholder={m.globals.value}
                className="w-1/2 min-w-0 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-800 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                onClick={() => removeGlobal(i)}
                title={m.inspector.deleteNode}
                className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2 text-[11px] leading-snug text-slate-400 dark:text-slate-500">{m.globals.hint}</p>
    </section>
  )
}
