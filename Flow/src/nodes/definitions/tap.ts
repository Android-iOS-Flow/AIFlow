import { MousePointerClick } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

export const tapConfig: NodeConfig = {
  type: 'tap',
  label: { en: 'Tap', vi: 'Chạm (Tap)' },
  description: { en: 'Tap at a coordinate on screen', vi: 'Chạm vào toạ độ trên màn hình' },
  category: 'basic',
  icon: MousePointerClick,
  color: 'sky',
  fields: [
    { key: 'x', label: { en: 'X', vi: 'X' }, type: 'number', default: 0, placeholder: { en: 'X coordinate', vi: 'Toạ độ X' } },
    { key: 'y', label: { en: 'Y', vi: 'Y' }, type: 'number', default: 0, placeholder: { en: 'Y coordinate', vi: 'Toạ độ Y' } },
  ],
}
