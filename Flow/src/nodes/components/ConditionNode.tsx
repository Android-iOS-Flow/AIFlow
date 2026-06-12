import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import type { FlowNode } from '@/types/flow.types'
import { useT } from '@/i18n/useT'
import { getColor } from '../colors'
import { getNodeConfig } from '../registry'
import { displayValue } from '../valueDisplay'

/**
 * Node điều kiện (If): 1 cổng vào, 2 cổng ra "true" (trái) và "false" (phải).
 * Dùng handle id để edge biết đi theo nhánh nào.
 */
export function ConditionNode({ data, selected }: NodeProps<FlowNode>) {
  const { tr } = useT()
  const config = getNodeConfig(data.type)
  if (!config) return null
  const color = getColor(config.color)
  const Icon = config.icon

  return (
    <div
      className={`relative h-full w-full min-w-[200px] rounded-lg border bg-white shadow-sm dark:bg-slate-800 ${color.border} ${
        selected ? `ring-2 ${color.ring}` : ''
      }`}
    >
      <NodeResizer isVisible={selected} minWidth={180} minHeight={90} />
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-slate-400" />

      <div
        className={`flex items-center gap-2 rounded-t-lg px-3 py-2 text-sm font-semibold text-white ${color.header}`}
      >
        <Icon size={16} />
        <span className="truncate">{data.label}</span>
      </div>

      <div className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex justify-between gap-2">
          <span className="text-slate-400 dark:text-slate-500">{tr(config.fields[0].label)}</span>
          <span className="max-w-[120px] truncate font-medium text-slate-700 dark:text-slate-200">
            {displayValue(data.values.expression)}
          </span>
        </div>
      </div>

      <div className="flex justify-between px-4 pb-1 text-[10px] font-semibold">
        <span className="text-emerald-600">TRUE</span>
        <span className="text-rose-600">FALSE</span>
      </div>

      <Handle
        id="true"
        type="source"
        position={Position.Bottom}
        style={{ left: '25%' }}
        className="!h-3 !w-3 !bg-emerald-500"
      />
      <Handle
        id="false"
        type="source"
        position={Position.Bottom}
        style={{ left: '75%' }}
        className="!h-3 !w-3 !bg-rose-500"
      />
    </div>
  )
}
