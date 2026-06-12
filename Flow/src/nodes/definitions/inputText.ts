import { Keyboard } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

export const inputTextConfig: NodeConfig = {
  type: 'inputText',
  label: { en: 'Input Text', vi: 'Nhập chữ' },
  description: { en: 'Type text into the focused field', vi: 'Nhập văn bản vào ô đang chọn' },
  category: 'basic',
  icon: Keyboard,
  color: 'sky',
  fields: [
    {
      key: 'text',
      label: { en: 'Content', vi: 'Nội dung' },
      type: 'textarea',
      default: '',
      placeholder: { en: 'Text to type', vi: 'Văn bản cần nhập' },
    },
    {
      key: 'selector',
      label: { en: 'Selector', vi: 'Selector' },
      type: 'text',
      default: '',
      placeholder: { en: 'Optional: id/xpath of the field', vi: 'Tuỳ chọn: id/xpath ô nhập' },
    },
  ],
}
