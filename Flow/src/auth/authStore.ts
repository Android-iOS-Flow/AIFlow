import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthResult {
  error?: string
  needsConfirm?: boolean
}

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean // đang kiểm tra phiên lần đầu

  /** Khởi tạo: lấy phiên hiện tại + lắng nghe thay đổi. Trả về hàm hủy đăng ký. */
  init: () => () => void
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  init: () => {
    // 1) Lấy phiên đã lưu (nếu có)
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, user: data.session?.user ?? null, loading: false })
    })

    // 2) Lắng nghe đăng nhập / đăng xuất / gia hạn token
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false })
    })

    return () => data.subscription.unsubscribe()
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    // Nếu dự án bật xác nhận email, session = null cho tới khi user bấm link xác nhận.
    return { needsConfirm: !data.session }
  },

  signOut: async () => {
    await supabase.auth.signOut()
  },
}))
