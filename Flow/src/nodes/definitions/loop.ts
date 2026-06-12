import { Repeat } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

export const loopConfig: NodeConfig = {
  type: 'loop',
  label: { en: 'Loop', vi: 'Lặp (Loop)' },
  description: { en: 'Repeat the following steps', vi: 'Lặp lại các bước phía sau' },
  category: 'logic',
  icon: Repeat,
  color: 'violet',
  fields: [
    {
      key: 'mode',
      label: { en: 'Loop type', vi: 'Kiểu lặp' },
      type: 'select',
      default: 'count',
      options: [
        { label: { en: 'By count', vi: 'Theo số lần' }, value: 'count' },
        { label: { en: 'By condition', vi: 'Theo điều kiện' }, value: 'while' },
      ],
    },
    { key: 'count', label: { en: 'Count', vi: 'Số lần' }, type: 'number', default: 3 },
    { key: 'condition', label: { en: 'Condition (while)', vi: 'Điều kiện (while)' }, type: 'text', default: '' },
  ],
}
