/**
 * Bảng màu cho node. Phải viết đầy đủ class để Tailwind không purge mất.
 * Thêm màu mới: thêm một entry ở đây rồi dùng key đó trong config.color.
 */
export interface NodeColorSet {
  header: string // nền header
  border: string // viền node
  ring: string // viền khi được chọn
  badge: string // chip icon trong Sidebar
  hex: string // màu cho MiniMap
}

export const NODE_COLORS: Record<string, NodeColorSet> = {
  slate: { header: 'bg-slate-600', border: 'border-slate-300', ring: 'ring-slate-400', badge: 'bg-slate-100 text-slate-700', hex: '#475569' },
  sky: { header: 'bg-sky-600', border: 'border-sky-300', ring: 'ring-sky-400', badge: 'bg-sky-100 text-sky-700', hex: '#0284c7' },
  emerald: { header: 'bg-emerald-600', border: 'border-emerald-300', ring: 'ring-emerald-400', badge: 'bg-emerald-100 text-emerald-700', hex: '#059669' },
  amber: { header: 'bg-amber-500', border: 'border-amber-300', ring: 'ring-amber-400', badge: 'bg-amber-100 text-amber-700', hex: '#f59e0b' },
  violet: { header: 'bg-violet-600', border: 'border-violet-300', ring: 'ring-violet-400', badge: 'bg-violet-100 text-violet-700', hex: '#7c3aed' },
  rose: { header: 'bg-rose-600', border: 'border-rose-300', ring: 'ring-rose-400', badge: 'bg-rose-100 text-rose-700', hex: '#e11d48' },
  indigo: { header: 'bg-indigo-600', border: 'border-indigo-300', ring: 'ring-indigo-400', badge: 'bg-indigo-100 text-indigo-700', hex: '#4f46e5' },
  teal: { header: 'bg-teal-600', border: 'border-teal-300', ring: 'ring-teal-400', badge: 'bg-teal-100 text-teal-700', hex: '#0d9488' },
  fuchsia: { header: 'bg-fuchsia-600', border: 'border-fuchsia-300', ring: 'ring-fuchsia-400', badge: 'bg-fuchsia-100 text-fuchsia-700', hex: '#c026d3' },
}

export function getColor(color: string): NodeColorSet {
  return NODE_COLORS[color] ?? NODE_COLORS.slate
}
