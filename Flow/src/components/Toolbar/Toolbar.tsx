import { Download, Trash2, Smartphone } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { useT } from '@/i18n/useT'
import { downloadFlow } from '@/lib/flowIo'
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher'
import { ThemeToggle } from '../ThemeToggle/ThemeToggle'
import { UserMenu } from '../Auth/UserMenu'
import { FileTab } from '../Cloud/FileTab'

/** Thanh công cụ trên cùng: tên file (VS Code) + xuất/xoá + ngôn ngữ/theme + user. */
export function Toolbar() {
  const { m } = useT()
  const nodes = useFlowStore((s) => s.nodes)
  const edges = useFlowStore((s) => s.edges)
  const globals = useFlowStore((s) => s.globals)
  const cloudName = useFlowStore((s) => s.cloudName)
  const cloudId = useFlowStore((s) => s.cloudId)
  const clear = useFlowStore((s) => s.clear)

  const handleExport = () => downloadFlow(nodes, edges, globals, `${cloudName ?? 'flow'}.json`)
  const handleClear = () => {
    if (confirm(m.toolbar.clearConfirm)) clear()
  }

  return (
    <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
      {/* Trái: logo + tên app */}
      <div className="flex items-center gap-2">
        <Smartphone size={20} className="text-sky-600 dark:text-sky-400" />
        <h1 className="hidden text-base font-bold text-slate-800 md:block dark:text-slate-100">
          {m.appTitle}
        </h1>
      </div>

      {/* Giữa: tên file flow đang sửa (giống VS Code) */}
      <FileTab />

      {/* Phải: hành động */}
      <div className="flex items-center gap-1.5">
        <ToolbarButton
          icon={Download}
          label={m.toolbar.export}
          onClick={handleExport}
          disabled={!cloudId}
        />
        <ToolbarButton
          icon={Trash2}
          label={m.toolbar.clear}
          onClick={handleClear}
          danger
          disabled={!cloudId}
        />
        <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
        <LanguageSwitcher />
        <ThemeToggle />
        <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
        <UserMenu />
      </div>
    </header>
  )
}

interface ToolbarButtonProps {
  icon: typeof Download
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

function ToolbarButton({ icon: Icon, label, onClick, danger, disabled }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950'
          : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={15} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  )
}
