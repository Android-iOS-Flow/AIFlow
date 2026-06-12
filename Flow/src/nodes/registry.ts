import type { NodeTypes } from '@xyflow/react'
import type { NodeCategory, NodeConfig } from '@/types/flow.types'
import { GenericNode } from './GenericNode'

// === Import tất cả định nghĩa node ===
import { startConfig } from './definitions/start'
import { endConfig } from './definitions/end'
import { tapConfig } from './definitions/tap'
import { swipeConfig } from './definitions/swipe'
import { inputTextConfig } from './definitions/inputText'
import { waitConfig } from './definitions/wait'
import { conditionConfig } from './definitions/condition'
import { switchRouterConfig } from './definitions/switchRouter'
import { loopConfig } from './definitions/loop'
import { findElementConfig } from './definitions/findElement'
import { managerAppConfig } from './definitions/managerApp'
import { adbCommandConfig } from './definitions/adbCommand'
import { backConfig } from './definitions/back'
import { homeConfig } from './definitions/home'
import { screenshotConfig } from './definitions/screenshot'
import { pusherListenConfig } from './definitions/pusherListen'

/**
 * Danh sách tất cả node. THÊM NODE MỚI: tạo file trong definitions/
 * rồi thêm config vào mảng này — không cần sửa chỗ nào khác.
 */
export const ALL_NODE_CONFIGS: NodeConfig[] = [
  startConfig,
  endConfig,
  tapConfig,
  swipeConfig,
  inputTextConfig,
  waitConfig,
  conditionConfig,
  switchRouterConfig,
  loopConfig,
  findElementConfig,
  managerAppConfig,
  adbCommandConfig,
  backConfig,
  homeConfig,
  screenshotConfig,
  pusherListenConfig,
]

/** Map type -> config để tra cứu nhanh. */
export const NODE_CONFIGS: Record<string, NodeConfig> = Object.fromEntries(
  ALL_NODE_CONFIGS.map((config) => [config.type, config]),
)

/** Lấy config theo type (function declaration để an toàn với circular import). */
export function getNodeConfig(type: string): NodeConfig | undefined {
  return NODE_CONFIGS[type]
}

/** Map component cho ReactFlow: dùng component riêng nếu có, không thì GenericNode. */
export const NODE_TYPES: NodeTypes = Object.fromEntries(
  ALL_NODE_CONFIGS.map((config) => [config.type, config.component ?? GenericNode]),
)

/** Thứ tự hiển thị các nhóm. Nhãn từng nhóm nằm trong i18n/messages (categories). */
export const CATEGORY_ORDER: NodeCategory[] = ['flow', 'basic', 'logic', 'app', 'event']

/** Gom các config theo nhóm để render Sidebar. */
export function getConfigsByCategory(): Record<NodeCategory, NodeConfig[]> {
  const grouped = {} as Record<NodeCategory, NodeConfig[]>
  CATEGORY_ORDER.forEach((cat) => {
    grouped[cat] = ALL_NODE_CONFIGS.filter((config) => config.category === cat)
  })
  return grouped
}
