import { GitBranch } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'
import { ConditionNode } from '../components/ConditionNode'

export const conditionConfig: NodeConfig = {
  type: 'condition',
  label: { en: 'Condition (If)', vi: 'Điều kiện (If)' },
  description: { en: 'Branch by a true/false condition', vi: 'Rẽ nhánh theo điều kiện true/false' },
  category: 'logic',
  icon: GitBranch,
  color: 'violet',
  fields: [
    {
      key: 'expression',
      label: { en: 'Expression', vi: 'Biểu thức' },
      type: 'text',
      default: '',
      placeholder: { en: 'e.g. foundElement == true', vi: 'vd: foundElement == true' },
    },
  ],
  component: ConditionNode,
}
