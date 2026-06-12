import type { FlowDocument, FlowEdge, FlowNode, GlobalVar } from '@/types/flow.types'

const FLOW_VERSION = 1
const DRAFT_PREFIX = 'phone-flow-builder:draft:'

/** Đóng gói nodes + edges + globals thành document để lưu/xuất. */
export function toDocument(
  nodes: FlowNode[],
  edges: FlowEdge[],
  globals: GlobalVar[] = [],
): FlowDocument {
  return { version: FLOW_VERSION, nodes, edges, globals }
}

/** Tải flow xuống máy dưới dạng file JSON. */
export function downloadFlow(
  nodes: FlowNode[],
  edges: FlowEdge[],
  globals: GlobalVar[] = [],
  filename = 'flow.json',
): void {
  const doc = toDocument(nodes, edges, globals)
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Đọc file JSON người dùng chọn và parse thành FlowDocument. */
export function readFlowFile(file: File): Promise<FlowDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const doc = JSON.parse(String(reader.result)) as FlowDocument
        if (!Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) {
          throw new Error('File flow không hợp lệ: thiếu nodes/edges')
        }
        resolve(doc)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

// === Bản nháp tự lưu (draft) trong localStorage, theo từng flow trên cloud ===
// Đây KHÔNG phải nơi lưu chính: lưu chính là database (Ctrl+S). Draft chỉ để
// chống mất dữ liệu khi sửa, tự ghi mỗi 10 giây.

export interface FlowDraft {
  document: FlowDocument
  savedAt: string // ISO time
}

const draftKey = (cloudId: string) => DRAFT_PREFIX + cloudId

/** Ghi bản nháp của flow đang sửa. */
export function saveDraft(cloudId: string, doc: FlowDocument): void {
  try {
    localStorage.setItem(
      draftKey(cloudId),
      JSON.stringify({ document: doc, savedAt: new Date().toISOString() } satisfies FlowDraft),
    )
  } catch {
    /* hết quota -> bỏ qua */
  }
}

/** Đọc bản nháp (null nếu không có). */
export function loadDraft(cloudId: string): FlowDraft | null {
  const raw = localStorage.getItem(draftKey(cloudId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as FlowDraft
  } catch {
    return null
  }
}

/** Xoá bản nháp (sau khi đã lưu lên database). */
export function clearDraft(cloudId: string): void {
  localStorage.removeItem(draftKey(cloudId))
}
