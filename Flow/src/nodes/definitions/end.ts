import { Square } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'
import { EndNode } from '../components/EndNode'

export const endConfig: NodeConfig = {
  type: 'end',
  label: { en: 'End', vi: 'Kết thúc' },
  description: { en: 'End point of the flow', vi: 'Điểm kết thúc của flow' },
  category: 'flow',
  icon: Square,
  color: 'rose',
  fields: [],
  hasSource: false,
  component: EndNode,
}
