import type { ComponentType } from 'react'
import type { Node, Edge, NodeProps } from '@xyflow/react'
import type { LucideIcon } from 'lucide-react'
import type { LocalizedText } from '@/i18n/types'

/**
 * Các nhóm (category) để gom node trong Sidebar.
 * Thêm nhóm mới ở đây + thêm nhãn trong CATEGORY_LABELS (registry.ts).
 */
export type NodeCategory =
  | 'flow' // Bắt đầu / Kết thúc
  | 'basic' // Hành động cơ bản
  | 'logic' // Điều kiện & vòng lặp
  | 'app' // Điều khiển ứng dụng
  | 'event' // Lắng nghe sự kiện (Pusher)

/** Kiểu input hỗ trợ trong NodeInspector. */
export type FieldType = 'text' | 'number' | 'textarea' | 'select'

/** Tham chiếu tới một biến global đã khai báo trong flow (có giá trị sẵn). */
export interface GlobalRef {
  $global: string
}

/**
 * Tham chiếu tới một biến runtime: chỉ khai báo TÊN, giá trị do tool remote
 * truyền vào lúc chạy (theo dữ liệu tool đó lưu). Không có giá trị trong flow.
 */
export interface VarRef {
  $var: string
}

/**
 * Giá trị của một field:
 *  - literal: text/số (giữ nguyên string|number → tương thích ngược)
 *  - global:  `{ $global: 'tên' }` — biến khai báo sẵn trong flow
 *  - var:     `{ $var: 'tên' }`   — tool remote truyền giá trị vào lúc chạy
 */
export type FieldValue = string | number | GlobalRef | VarRef

/** Biến global khai báo ở cấp flow, engine remote nạp làm dữ liệu ban đầu. */
export interface GlobalVar {
  name: string
  value: string | number
  description?: string
}

/** Kiểm tra một FieldValue có phải tham chiếu global không. */
export function isGlobalRef(v: unknown): v is GlobalRef {
  return typeof v === 'object' && v !== null && '$global' in v
}

/** Kiểm tra một FieldValue có phải biến runtime (tool truyền vào) không. */
export function isVarRef(v: unknown): v is VarRef {
  return typeof v === 'object' && v !== null && '$var' in v
}

/** Định nghĩa một tham số (field) của node. */
export interface NodeFieldDef {
  /** key lưu trong node.data */
  key: string
  /** nhãn hiển thị trong Inspector (song ngữ) */
  label: LocalizedText
  type: FieldType
  /** giá trị mặc định khi tạo node mới */
  default: string | number
  /** placeholder cho input (song ngữ) */
  placeholder?: LocalizedText
  /** danh sách lựa chọn cho type = 'select' */
  options?: { label: LocalizedText; value: string }[]
}

/** Dữ liệu lưu trong mỗi node (node.data). */
export interface FlowNodeData {
  /** loại node, trùng key trong NODE_CONFIGS */
  type: string
  /** nhãn người dùng có thể chỉnh (mặc định = config.label) */
  label: string
  /** giá trị các field tham số (literal hoặc tham chiếu global) */
  values: Record<string, FieldValue>
  [key: string]: unknown
}

/** Node của ReactFlow đã gắn FlowNodeData. */
export type FlowNode = Node<FlowNodeData>
export type FlowEdge = Edge

/**
 * Cấu hình một loại node — TRÁI TIM của thiết kế module hóa.
 * Mỗi file trong nodes/definitions/ export một object NodeConfig.
 */
export interface NodeConfig {
  /** id loại node, duy nhất (vd: 'tap', 'pusherListen') */
  type: string
  /** tên hiển thị (song ngữ) */
  label: LocalizedText
  /** mô tả ngắn trong Sidebar (song ngữ) */
  description?: LocalizedText
  category: NodeCategory
  icon: LucideIcon
  /** màu chủ đạo (Tailwind class gốc, vd: 'sky', 'emerald') */
  color: string
  /** danh sách tham số */
  fields: NodeFieldDef[]
  /** có cổng vào (target) không — mặc định true */
  hasTarget?: boolean
  /** có cổng ra (source) không — mặc định true */
  hasSource?: boolean
  /**
   * Component render tùy chỉnh. Nếu bỏ trống sẽ dùng GenericNode.
   * Dùng cho node đặc biệt như Condition (2 nhánh true/false).
   */
  component?: ComponentType<NodeProps<FlowNode>>
}

/** Cấu trúc file flow khi export/import JSON. */
export interface FlowDocument {
  version: number
  nodes: FlowNode[]
  edges: FlowEdge[]
  /** Biến global cấp flow (tuỳ chọn để tương thích file cũ). */
  globals?: GlobalVar[]
}
