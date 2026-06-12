import { Timer } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

export const waitConfig: NodeConfig = {
  type: 'wait',
  label: { en: 'Wait', vi: 'Chờ (Wait)' },
  description: { en: 'Pause for a while', vi: 'Tạm dừng một khoảng thời gian' },
  category: 'basic',
  icon: Timer,
  color: 'amber',
  fields: [{ key: 'ms', label: { en: 'Time (ms)', vi: 'Thời gian (ms)' }, type: 'number', default: 1000 }],
}
