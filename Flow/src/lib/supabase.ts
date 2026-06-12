import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  // Báo sớm nếu thiếu cấu hình — xem .env.example
  console.error('[supabase] Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_PUBLISHABLE_KEY trong .env')
}

/**
 * Client Supabase dùng cho SPA (trình duyệt).
 * Dùng publishable key — KHÔNG bao giờ đặt secret/service_role key ở client.
 */
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true, // lưu phiên vào localStorage
    autoRefreshToken: true, // tự gia hạn token
    detectSessionInUrl: true, // xử lý link xác nhận email/redirect
  },
})
