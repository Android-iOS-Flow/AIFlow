import { ArrowLeft } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

export const backConfig: NodeConfig = {
  type: 'back',
  label: { en: 'Back button', vi: 'Nút Back' },
  description: { en: 'Press the back button', vi: 'Nhấn nút quay lại' },
  category: 'app',
  icon: ArrowLeft,
  color: 'teal',
  fields: [],
}
