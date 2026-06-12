import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import type { FlowNode } from '@/types/flow.types'
import { getColor } from '../colors'
import { getNodeConfig } from '../registry'

/** Node bắt đầu: chỉ có cổng ra. */
export function StartNode({ data, selected }: NodeProps<FlowNode>) {
  const config = getNodeConfig(data.type)
  if (!config) return null
  const color = getColor(config.color)
  const Icon = config.icon

  return (
    <div
      className={`flex h-full w-full items-center justify-center gap-2 rounded-full border px-5 py-2.5 font-semibold text-white shadow-sm ${color.header} ${color.border} ${
        selected ? `ring-2 ${color.ring}` : ''
      }`}
    >
      <NodeResizer isVisible={selected} minWidth={100} minHeight={44} />
      <Icon size={16} />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-white" />
    </div>
  )
}
