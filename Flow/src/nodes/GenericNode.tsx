import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import type { FlowNode } from '@/types/flow.types'
import { useT } from '@/i18n/useT'
import { getColor } from './colors'
import { getNodeConfig } from './registry'
import { displayValue } from './valueDisplay'

/**
 * Component render chung cho hầu hết các loại node.
 * Đọc cấu hình từ registry theo data.type rồi vẽ header (icon + nhãn)
 * và tóm tắt các tham số. Node đặc biệt sẽ tự định nghĩa component riêng.
 */
export function GenericNode({ data, selected }: NodeProps<FlowNode>) {
  const { tr } = useT()
  const config = getNodeConfig(data.type)
  if (!config) return null

  const color = getColor(config.color)
  const Icon = config.icon
  const hasTarget = config.hasTarget !== false
  const hasSource = config.hasSource !== false

  return (
    <div
      className={`flex h-full w-full min-w-[180px] flex-col rounded-lg border bg-white shadow-sm transition dark:bg-slate-800 ${color.border} ${
        selected ? `ring-2 ${color.ring}` : ''
      }`}
    >
      <NodeResizer isVisible={selected} minWidth={160} minHeight={56} />
      {hasTarget && (
        <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-slate-400" />
      )}

      <div
        className={`flex items-center gap-2 rounded-t-lg px-3 py-2 text-sm font-semibold text-white ${color.header}`}
      >
        <Icon size={16} />
        <span className="truncate">{data.label}</span>
      </div>

      {config.fields.length > 0 && (
        <div className="space-y-0.5 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
          {config.fields.map((field) => (
            <div key={field.key} className="flex justify-between gap-2">
              <span className="text-slate-400 dark:text-slate-500">{tr(field.label)}</span>
              <span className="max-w-[110px] truncate font-medium text-slate-700 dark:text-slate-200">
                {displayValue(data.values[field.key])}
              </span>
            </div>
          ))}
        </div>
      )}

      {hasSource && (
        <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-slate-400" />
      )}
    </div>
  )
}
