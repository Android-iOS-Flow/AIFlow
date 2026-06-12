import { useCallback, type DragEvent } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type EdgeTypes,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useFlowStore } from '@/store/flowStore'
import { useThemeStore } from '@/theme/themeStore'
import { NODE_TYPES, getNodeConfig } from '@/nodes/registry'
import { getColor } from '@/nodes/colors'
import { DeletableEdge } from '../edges/DeletableEdge'
import type { FlowNode } from '@/types/flow.types'

/** Loại edge có nút xoá kết nối. */
const EDGE_TYPES: EdgeTypes = { deletable: DeletableEdge }

const DEFAULT_EDGE_OPTIONS = { type: 'deletable', animated: true }

/** Khu vực vẽ flow chính. */
export function FlowCanvas() {
  const { screenToFlowPosition } = useReactFlow()
  const theme = useThemeStore((s) => s.theme)
  const nodes = useFlowStore((s) => s.nodes)
  const edges = useFlowStore((s) => s.edges)
  const onNodesChange = useFlowStore((s) => s.onNodesChange)
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange)
  const onConnect = useFlowStore((s) => s.onConnect)
  const addNode = useFlowStore((s) => s.addNode)
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode)

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addNode(type, position)
    },
    [screenToFlowPosition, addNode],
  )

  const onNodeClick: NodeMouseHandler<FlowNode> = useCallback(
    (_event, node) => setSelectedNode(node.id),
    [setSelectedNode],
  )

  return (
    <div className="h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        colorMode={theme}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedNode(null)}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={24}
          lineWidth={1}
          patternClassName="rf-dashed-grid"
          color={theme === 'dark' ? '#334155' : '#cbd5e1'}
        />
        <Controls />
        <MiniMap
          position="top-right"
          pannable
          zoomable
          nodeColor={(node) => {
            const config = getNodeConfig((node.data as FlowNode['data']).type)
            return config ? getColor(config.color).hex : '#94a3b8'
          }}
          nodeStrokeWidth={3}
        />
      </ReactFlow>
    </div>
  )
}
