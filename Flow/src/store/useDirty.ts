import { useFlowStore } from './flowStore'
import { toDocument } from '@/lib/flowIo'

/** true nếu flow đang mở đã bị sửa so với bản lưu cloud gần nhất. */
export function useDirty(): boolean {
  return useFlowStore(
    (s) =>
      s.cloudId !== null &&
      JSON.stringify(toDocument(s.nodes, s.edges, s.globals)) !== s.cloudBaseline,
  )
}
