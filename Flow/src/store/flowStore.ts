import { create } from 'zustand'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react'
import type {
  FieldValue,
  FlowDocument,
  FlowEdge,
  FlowNode,
  FlowNodeData,
  GlobalVar,
} from '@/types/flow.types'
import { NODE_CONFIGS } from '@/nodes/registry'
import { createNodeId } from '@/lib/id'
import { useLocaleStore } from '@/i18n/localeStore'

interface FlowState {
  nodes: FlowNode[]
  edges: FlowEdge[]
  globals: GlobalVar[]
  selectedNodeId: string | null
  /** id/tên flow đang gắn với cloud (để "Lưu" biết là update hay tạo mới). */
  cloudId: string | null
  cloudName: string | null
  /** JSON của bản đã lưu lên cloud gần nhất — dùng để tính "đã sửa chưa" (dirty). */
  cloudBaseline: string | null
  saveStatus: 'idle' | 'saving' | 'saved'

  // Handlers cho ReactFlow
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void
  onConnect: (connection: Connection) => void

  // Thao tác nghiệp vụ
  addNode: (type: string, position: XYPosition) => void
  updateNodeData: (id: string, values: Record<string, FieldValue>) => void
  updateNodeLabel: (id: string, label: string) => void
  setSelectedNode: (id: string | null) => void
  removeNode: (id: string) => void
  removeEdge: (id: string) => void

  // Globals
  addGlobal: () => void
  updateGlobal: (index: number, patch: Partial<GlobalVar>) => void
  removeGlobal: (index: number) => void

  // Cloud
  setCloudRef: (id: string | null, name: string | null) => void
  setCloudBaseline: (json: string | null) => void
  setSaveStatus: (status: 'idle' | 'saving' | 'saved') => void

  // Import / clear
  setFlow: (doc: FlowDocument) => void
  clear: () => void
}

/** Tạo data mặc định cho node theo config (nhãn lấy theo ngôn ngữ hiện tại). */
function buildDefaultData(type: string): FlowNodeData {
  const config = NODE_CONFIGS[type]
  const locale = useLocaleStore.getState().locale
  const values: Record<string, FieldValue> = {}
  config.fields.forEach((field) => {
    values[field.key] = field.default
  })
  return { type, label: config.label[locale] ?? config.label.en, values }
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  globals: [],
  selectedNodeId: null,
  cloudId: null,
  cloudName: null,
  cloudBaseline: null,
  saveStatus: 'idle',

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  onConnect: (connection) => {
    set({ edges: addEdge({ ...connection, type: 'deletable', animated: true }, get().edges) })
  },

  addNode: (type, position) => {
    const config = NODE_CONFIGS[type]
    if (!config) return
    const newNode: FlowNode = {
      id: createNodeId(type),
      type,
      position,
      data: buildDefaultData(type),
    }
    set({ nodes: [...get().nodes, newNode] })
  },

  updateNodeData: (id, values) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, values: { ...node.data.values, ...values } } }
          : node,
      ),
    })
  },

  updateNodeLabel: (id, label) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, label } } : node,
      ),
    })
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  removeEdge: (id) => {
    set({ edges: get().edges.filter((edge) => edge.id !== id) })
  },

  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    })
  },

  addGlobal: () => {
    const existing = get().globals
    const base = 'var'
    let i = existing.length + 1
    let name = `${base}${i}`
    const names = new Set(existing.map((g) => g.name))
    while (names.has(name)) name = `${base}${++i}`
    set({ globals: [...existing, { name, value: '' }] })
  },

  updateGlobal: (index, patch) => {
    set({
      globals: get().globals.map((g, i) => (i === index ? { ...g, ...patch } : g)),
    })
  },

  removeGlobal: (index) => {
    set({ globals: get().globals.filter((_, i) => i !== index) })
  },

  setCloudRef: (cloudId, cloudName) => set({ cloudId, cloudName }),
  setCloudBaseline: (cloudBaseline) => set({ cloudBaseline }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),

  setFlow: (doc) => {
    const edges = (doc.edges ?? []).map((edge) => ({
      type: 'deletable',
      animated: true,
      ...edge,
    }))
    set({
      nodes: doc.nodes ?? [],
      edges,
      globals: doc.globals ?? [],
      selectedNodeId: null,
      cloudId: null,
      cloudName: null,
    })
  },

  // Xoá nội dung flow ĐANG MỞ (giữ nguyên file cloud đang gắn).
  clear: () => set({ nodes: [], edges: [], globals: [], selectedNodeId: null }),
}))
