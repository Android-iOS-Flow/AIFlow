import type { DragEvent } from 'react'
import type { NodeConfig } from '@/types/flow.types'
import { getColor } from '@/nodes/colors'
import { useT } from '@/i18n/useT'

interface PaletteItemProps {
  config: NodeConfig
}

/** Một mục trong bảng node — kéo được vào canvas. */
export function PaletteItem({ config }: PaletteItemProps) {
  const { tr } = useT()
  const color = getColor(config.color)
  const Icon = config.icon

  const onDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/reactflow', config.type)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      title={config.description ? tr(config.description) : undefined}
      className="flex cursor-grab items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm shadow-sm transition hover:border-slate-300 hover:shadow active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-md ${color.badge}`}>
        <Icon size={16} />
      </span>
      <span className="truncate font-medium text-slate-700 dark:text-slate-200">{tr(config.label)}</span>
    </div>
  )
}
