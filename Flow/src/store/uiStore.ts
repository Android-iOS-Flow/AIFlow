import { create } from 'zustand'

interface PendingRestore {
  savedAt: string
  resolve: (restore: boolean) => void
}

interface UiState {
  flowsModalOpen: boolean
  openFlowsModal: () => void
  closeFlowsModal: () => void

  /** Yêu cầu khôi phục bản nháp đang chờ trả lời (null = không có). */
  restore: PendingRestore | null
  /** Hiện dialog hỏi khôi phục nháp; trả về Promise<true nếu khôi phục>. */
  requestRestore: (savedAt: string) => Promise<boolean>
  /** Dialog gọi khi người dùng chọn. */
  answerRestore: (restore: boolean) => void
}

/** Trạng thái giao diện tạm thời (popup quản lý file, dialog khôi phục...). */
export const useUiStore = create<UiState>((set, get) => ({
  flowsModalOpen: false,
  openFlowsModal: () => set({ flowsModalOpen: true }),
  closeFlowsModal: () => set({ flowsModalOpen: false }),

  restore: null,
  requestRestore: (savedAt) =>
    new Promise<boolean>((resolve) => {
      set({ restore: { savedAt, resolve } })
    }),
  answerRestore: (restore) => {
    get().restore?.resolve(restore)
    set({ restore: null })
  },
}))
