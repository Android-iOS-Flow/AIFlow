import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { X } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { useT } from '@/i18n/useT'

/**
 * Edge có nút xoá (X) ở giữa đường nối.
 * Bấm nút sẽ gỡ kết nối giữa 2 node.
 */
export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  const { m } = useT()
  const removeEdge = useFlowStore((s) => s.removeEdge)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <button
          className="nodrag nopan flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 shadow-sm transition hover:scale-110 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-rose-500 dark:hover:bg-rose-950 dark:hover:text-rose-400"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          onClick={(event) => {
            event.stopPropagation()
            removeEdge(id)
          }}
          title={m.edge.delete}
        >
          <X size={12} />
        </button>
      </EdgeLabelRenderer>
    </>
  )
}
