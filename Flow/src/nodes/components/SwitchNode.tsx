import { useEffect } from 'react'
import {
  Handle,
  NodeResizer,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from '@xyflow/react'
import type { FlowNode } from '@/types/flow.types'
import { useT } from '@/i18n/useT'
import { getColor } from '../colors'
import { getNodeConfig } from '../registry'
import { displayValue } from '../valueDisplay'

/** Tách chuỗi "a, b, c" thành mảng case ["a","b","c"]. (cases phải là literal) */
export function parseCases(raw: unknown): string[] {
  if (typeof raw !== 'string' && typeof raw !== 'number') return []
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Node Switch (Router): 1 cổng vào, NHIỀU cổng ra động.
 * Mỗi case sinh 1 cổng ra (handle id = tên case) + 1 cổng "default".
 * Engine định tuyến bằng cách so giá trị `source` với handle id.
 */
export function SwitchNode({ id, data, selected }: NodeProps<FlowNode>) {
  const { tr } = useT()
  const updateNodeInternals = useUpdateNodeInternals()
  const config = getNodeConfig(data.type)

  const cases = parseCases(data.values.cases)
  const handles = [...cases, 'default']

  // Số cổng ra thay đổi theo cases -> báo ReactFlow tính lại vị trí handle/edge.
  useEffect(() => {
    updateNodeInternals(id)
  }, [id, data.values.cases, updateNodeInternals])

  if (!config) return null
  const color = getColor(config.color)
  const Icon = config.icon

  return (
    <div
      className={`relative h-full w-full min-w-[220px] rounded-lg border bg-white shadow-sm dark:bg-slate-800 ${color.border} ${
        selected ? `ring-2 ${color.ring}` : ''
      }`}
    >
      <NodeResizer isVisible={selected} minWidth={200} minHeight={100} />
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
            {displayValue(data.values.source)}
          </span>
        </div>
      </div>

      {/* Hàng nhãn + cổng ra cho từng case (và default) */}
      <div className="relative h-7">
        {handles.map((h, i) => {
          const left = `${((i + 1) / (handles.length + 1)) * 100}%`
          const isDefault = h === 'default'
          return (
            <span key={h}>
              <span
                style={{ left }}
                className={`absolute top-0 -translate-x-1/2 max-w-[70px] truncate text-[10px] font-semibold ${
                  isDefault ? 'text-slate-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {h}
              </span>
              <Handle
                id={h}
                type="source"
                position={Position.Bottom}
                style={{ left }}
                className={`!h-3 !w-3 ${isDefault ? '!bg-slate-400' : '!bg-amber-500'}`}
              />
            </span>
          )
        })}
      </div>
    </div>
  )
}
