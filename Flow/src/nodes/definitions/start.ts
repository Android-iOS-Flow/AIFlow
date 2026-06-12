import { Play } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'
import { StartNode } from '../components/StartNode'

export const startConfig: NodeConfig = {
  type: 'start',
  label: { en: 'Start', vi: 'Bắt đầu' },
  description: { en: 'Entry point of the flow', vi: 'Điểm bắt đầu của flow' },
  category: 'flow',
  icon: Play,
  color: 'emerald',
  fields: [],
  hasTarget: false,
  component: StartNode,
}
