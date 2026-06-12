import { supabase } from './supabase'
import type { FlowDocument } from '@/types/flow.types'

/** Thông tin tóm tắt một flow trên cloud (để liệt kê). */
export interface CloudFlowMeta {
  id: string
  name: string
  is_public: boolean
  updated_at: string
}

const META = 'id,name,is_public,updated_at'

/** Liệt kê flow của user hiện tại (RLS tự lọc theo chủ sở hữu). */
export async function listMyFlows(): Promise<CloudFlowMeta[]> {
  const { data, error } = await supabase
    .from('flows')
    .select(META)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Lưu một flow MỚI. user_id tự gán = auth.uid() (default ở DB). */
export async function saveNewFlow(name: string, document: FlowDocument): Promise<CloudFlowMeta> {
  const { data, error } = await supabase
    .from('flows')
    .insert({ name, document })
    .select(META)
    .single()
  if (error) throw error
  return data
}

/** Cập nhật flow đã có (đổi tên / nội dung / công khai). */
export async function updateFlow(
  id: string,
  patch: { name?: string; document?: FlowDocument; is_public?: boolean },
): Promise<void> {
  const { error } = await supabase.from('flows').update(patch).eq('id', id)
  if (error) throw error
}

/** Đọc nội dung 1 flow theo id (của mình, hoặc flow công khai bất kỳ). */
export async function loadCloudFlow(id: string): Promise<{ name: string; document: FlowDocument }> {
  const { data, error } = await supabase
    .from('flows')
    .select('name,document')
    .eq('id', id)
    .single()
  if (error) throw error
  return { name: data.name, document: data.document as FlowDocument }
}

/** Xoá flow (chỉ chủ sở hữu). */
export async function deleteCloudFlow(id: string): Promise<void> {
  const { error } = await supabase.from('flows').delete().eq('id', id)
  if (error) throw error
}
