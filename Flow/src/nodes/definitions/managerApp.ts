import { LayoutGrid } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

/**
 * Node gộp toàn bộ thao tác quản lý ứng dụng vào MỘT node, chọn hành động qua field `action`.
 * Quy ước dự án: gộp các tính năng liên quan vào 1 node thay vì tách nhiều node.
 */
export const managerAppConfig: NodeConfig = {
  type: 'managerApp',
  label: { en: 'Manager App', vi: 'Quản lý ứng dụng' },
  description: { en: 'Manage an application', vi: 'Quản lý một ứng dụng' },
  category: 'app',
  icon: LayoutGrid,
  color: 'indigo',
  fields: [
    {
      key: 'action',
      label: { en: 'Action', vi: 'Hành động' },
      type: 'select',
      default: 'open',
      options: [
        { label: { en: 'Open', vi: 'Mở' }, value: 'open' },
        { label: { en: 'Close', vi: 'Đóng' }, value: 'close' },
        { label: { en: 'Kill', vi: 'Kill (tắt hẳn)' }, value: 'kill' },
        { label: { en: 'Grant permission', vi: 'Cấp quyền' }, value: 'grant' },
        { label: { en: 'Get app info', vi: 'Lấy thông tin app' }, value: 'info' },
      ],
    },
    {
      key: 'package',
      label: { en: 'Package name', vi: 'Package name' },
      type: 'text',
      default: '',
      placeholder: { en: 'e.g. com.android.chrome', vi: 'vd: com.android.chrome' },
    },
    {
      key: 'permission',
      label: { en: 'Permission (for Grant)', vi: 'Quyền (khi Cấp quyền)' },
      type: 'text',
      default: '',
      placeholder: { en: 'e.g. android.permission.CAMERA', vi: 'vd: android.permission.CAMERA' },
    },
  ],
}
