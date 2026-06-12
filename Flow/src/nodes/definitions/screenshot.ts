import { Camera } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

export const screenshotConfig: NodeConfig = {
  type: 'screenshot',
  label: { en: 'Screenshot', vi: 'Chụp màn hình' },
  description: { en: 'Save the current screen image', vi: 'Lưu ảnh màn hình hiện tại' },
  category: 'app',
  icon: Camera,
  color: 'teal',
  fields: [
    {
      key: 'filename',
      label: { en: 'File name', vi: 'Tên file' },
      type: 'text',
      default: 'screenshot.png',
      placeholder: { en: 'e.g. screen_01.png', vi: 'vd: screen_01.png' },
    },
  ],
}
