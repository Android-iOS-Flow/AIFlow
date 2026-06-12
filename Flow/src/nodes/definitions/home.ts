import { Home } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

export const homeConfig: NodeConfig = {
  type: 'home',
  label: { en: 'Home button', vi: 'Nút Home' },
  description: { en: 'Go to the home screen', vi: 'Về màn hình chính' },
  category: 'app',
  icon: Home,
  color: 'teal',
  fields: [],
}
