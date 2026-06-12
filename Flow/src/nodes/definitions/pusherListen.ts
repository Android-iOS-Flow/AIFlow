import { Radio } from 'lucide-react'
import type { NodeConfig } from '@/types/flow.types'

/**
 * Node lắng nghe sự kiện Pusher (realtime).
 * Là node nguồn kích hoạt flow -> không có cổng vào (hasTarget = false).
 */
export const pusherListenConfig: NodeConfig = {
  type: 'pusherListen',
  label: { en: 'Pusher Listen', vi: 'Lắng nghe Pusher' },
  description: {
    en: 'Trigger the flow when a realtime event arrives',
    vi: 'Kích hoạt flow khi nhận sự kiện realtime',
  },
  category: 'event',
  icon: Radio,
  color: 'fuchsia',
  fields: [
    { key: 'appKey', label: { en: 'App Key', vi: 'App Key' }, type: 'text', default: '', placeholder: { en: 'Pusher app key', vi: 'Pusher app key' } },
    { key: 'cluster', label: { en: 'Cluster', vi: 'Cluster' }, type: 'text', default: 'ap1', placeholder: { en: 'e.g. ap1', vi: 'vd: ap1' } },
    { key: 'channel', label: { en: 'Channel', vi: 'Channel' }, type: 'text', default: '', placeholder: { en: 'e.g. device-001', vi: 'vd: device-001' } },
    { key: 'event', label: { en: 'Event', vi: 'Event' }, type: 'text', default: '', placeholder: { en: 'e.g. command', vi: 'vd: command' } },
  ],
  hasTarget: false,
}
