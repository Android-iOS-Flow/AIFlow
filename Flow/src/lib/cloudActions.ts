import { useFlowStore } from '@/store/flowStore'
import { toDocument, loadDraft, clearDraft, type FlowDraft } from '@/lib/flowIo'
import { loadCloudFlow, saveNewFlow, updateFlow } from '@/lib/cloudFlows'
import { publishRun } from '@/lib/ably'
import type { FlowDocument } from '@/types/flow.types'

/** Gắn 1 document vào canvas + đặt baseline = bản này (coi như đã lưu). */
function applyAsSaved(id: string, name: string, doc: FlowDocument) {
  const s = useFlowStore.getState()
  s.setFlow(doc) // setFlow reset cloudId -> phải set lại bên dưới
  s.setCloudRef(id, name)
  s.setCloudBaseline(JSON.stringify(doc))
  s.setSaveStatus('saved')
}

/**
 * Mở 1 flow từ cloud vào canvas. Nếu có bản nháp (draft) mới hơn,
 * gọi `onDraft(savedAt)` -> nếu trả true thì khôi phục bản nháp.
 */
export async function openCloudFlow(
  id: string,
  onDraft?: (draft: FlowDraft) => boolean | Promise<boolean>,
): Promise<void> {
  const { name, document } = await loadCloudFlow(id)
  applyAsSaved(id, name, document)

  const draft = loadDraft(id)
  if (draft && JSON.stringify(draft.document) !== JSON.stringify(document)) {
    const restore = onDraft ? await onDraft(draft) : false
    if (restore) {
      // Khôi phục bản nháp: nội dung khác baseline -> trở thành "đã sửa" (dirty)
      const s = useFlowStore.getState()
      s.setFlow(draft.document)
      s.setCloudRef(id, name)
      // KHÔNG đổi baseline -> dirty = true, người dùng Ctrl+S để lưu
    } else {
      clearDraft(id)
    }
  }
}

/** Tạo 1 flow MỚI (rỗng) trên cloud rồi mở nó ra. */
export async function createCloudFlow(name: string): Promise<void> {
  const emptyDoc = toDocument([], [], [])
  const meta = await saveNewFlow(name, emptyDoc)
  applyAsSaved(meta.id, meta.name, emptyDoc)
}

/** Tạo flow mới từ một document có sẵn (vd nhập từ file). */
export async function createCloudFlowFromDoc(name: string, doc: FlowDocument): Promise<void> {
  const meta = await saveNewFlow(name, doc)
  applyAsSaved(meta.id, meta.name, doc)
}

/** Lưu flow đang sửa lên database (Ctrl+S). Trả về true nếu thành công. */
export async function saveCurrentToCloud(): Promise<boolean> {
  const s = useFlowStore.getState()
  if (!s.cloudId) return false
  const doc = toDocument(s.nodes, s.edges, s.globals)
  s.setSaveStatus('saving')
  try {
    await updateFlow(s.cloudId, { name: s.cloudName ?? 'flow', document: doc })
    s.setCloudBaseline(JSON.stringify(doc))
    clearDraft(s.cloudId)
    s.setSaveStatus('saved')
    return true
  } catch (err) {
    s.setSaveStatus('idle')
    alert('Lỗi lưu lên cloud: ' + (err as Error).message)
    return false
  }
}

/** Bấm Run: lưu DB rồi gửi id file lên Ably. */
export async function runCurrentFlow(): Promise<void> {
  const s = useFlowStore.getState()
  if (!s.cloudId) return
  const ok = await saveCurrentToCloud()
  if (!ok) return
  await publishRun(s.cloudId, s.cloudName)
}
