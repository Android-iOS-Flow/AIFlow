import { Split } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'
import { SwitchNode } from '../components/SwitchNode'

/**
 * Node Switch (Router): định tuyến tới nhiều nhánh theo một giá trị.
 * Thường đặt ngay sau Pusher Listen để rẽ task theo lệnh nhận được
 * (vd `payload.command`). Mỗi case là 1 cổng ra; còn lại đi vào "default".
 */
export const switchRouterConfig: NodeConfig = {
  type: 'switch',
  label: { en: 'Switch (Router)', vi: 'Phân nhánh (Switch)' },
  description: {
    en: 'Route to a branch by a value',
    vi: 'Định tuyến tới nhánh theo một giá trị',
  },
  category: 'logic',
  icon: Split,
  color: 'amber',
  fields: [
    {
      key: 'source',
      label: { en: 'Switch on', vi: 'Rẽ theo' },
      type: 'text',
      default: 'payload.command',
      placeholder: { en: 'e.g. payload.command', vi: 'vd: payload.command' },
    },
    {
      key: 'cases',
      label: { en: 'Cases (comma-separated)', vi: 'Các nhánh (phân cách dấu phẩy)' },
      type: 'text',
      default: 'login,post',
      placeholder: { en: 'e.g. login,post,like', vi: 'vd: login,post,like' },
    },
  ],
  component: SwitchNode,
}
