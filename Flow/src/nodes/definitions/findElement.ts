import { ScanSearch } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

export const findElementConfig: NodeConfig = {
  type: 'findElement',
  label: { en: 'Find Element', vi: 'Tìm phần tử' },
  description: { en: 'Find an image/element on screen', vi: 'Tìm ảnh/element trên màn hình' },
  category: 'logic',
  icon: ScanSearch,
  color: 'violet',
  fields: [
    {
      key: 'selector',
      label: { en: 'Selector / image', vi: 'Selector / ảnh' },
      type: 'text',
      default: '',
      placeholder: { en: 'id, xpath or image path', vi: 'id, xpath hoặc đường dẫn ảnh' },
    },
    { key: 'timeout', label: { en: 'Timeout (ms)', vi: 'Timeout (ms)' }, type: 'number', default: 5000 },
  ],
}
