import { CATEGORY_ORDER, getConfigsByCategory } from '@/nodes/registry'
import { useT } from '@/i18n/useT'
import { PaletteItem } from './PaletteItem'
import { GlobalsPanel } from '../Globals/GlobalsPanel'

/** Cột trái: quản lý Globals + bảng các loại node (kéo-thả vào canvas). */
export function Sidebar() {
  const { m } = useT()
  const grouped = getConfigsByCategory()

  return (
    <aside className="flex w-60 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <GlobalsPanel />

      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{m.sidebar.title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{m.sidebar.subtitle}</p>
      </div>

      <div className="space-y-4 p-3">
        {CATEGORY_ORDER.map((cat) => (
          <div key={cat}>
            <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {m.categories[cat]}
            </h3>
            <div className="space-y-1.5">
              {grouped[cat].map((config) => (
                <PaletteItem key={config.type} config={config} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
