import { Move } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

export const swipeConfig: NodeConfig = {
  type: 'swipe',
  label: { en: 'Swipe', vi: 'Vuốt (Swipe)' },
  description: { en: 'Swipe from one point to another', vi: 'Vuốt từ điểm này tới điểm khác' },
  category: 'basic',
  icon: Move,
  color: 'sky',
  fields: [
    { key: 'x1', label: { en: 'From X', vi: 'Từ X' }, type: 'number', default: 0 },
    { key: 'y1', label: { en: 'From Y', vi: 'Từ Y' }, type: 'number', default: 0 },
    { key: 'x2', label: { en: 'To X', vi: 'Đến X' }, type: 'number', default: 0 },
    { key: 'y2', label: { en: 'To Y', vi: 'Đến Y' }, type: 'number', default: 0 },
    { key: 'duration', label: { en: 'Duration (ms)', vi: 'Thời lượng (ms)' }, type: 'number', default: 300 },
  ],
}
