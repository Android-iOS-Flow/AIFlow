import { Terminal } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

/**
 * Node chạy một lệnh ADB tuỳ ý, kèm dữ liệu truyền thêm.
 * Cả `command` và `args` đều có thể gán Global/Var để tool remote bơm dữ liệu vào lúc chạy.
 */
export const adbCommandConfig: NodeConfig = {
  type: 'adbCommand',
  label: { en: 'ADB Command', vi: 'Lệnh ADB' },
  description: { en: 'Run a custom ADB command', vi: 'Chạy một lệnh ADB tuỳ ý' },
  category: 'app',
  icon: Terminal,
  color: 'slate',
  fields: [
    {
      key: 'command',
      label: { en: 'Command', vi: 'Lệnh' },
      type: 'textarea',
      default: '',
      placeholder: { en: 'e.g. shell input tap 500 1000', vi: 'vd: shell input tap 500 1000' },
    },
    {
      key: 'args',
      label: { en: 'Extra data', vi: 'Dữ liệu thêm' },
      type: 'text',
      default: '',
      placeholder: { en: 'optional args / data', vi: 'tham số / dữ liệu (tuỳ chọn)' },
    },
  ],
}
