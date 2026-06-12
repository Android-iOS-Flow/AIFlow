import { useState } from 'react'
import { Check, Loader2, Play } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { useT } from '@/i18n/useT'
import { runCurrentFlow } from '@/lib/cloudActions'

type RunState = 'idle' | 'running' | 'sent'

/** Nút Run ở góc dưới phải: lưu DB + gửi id file lên Ably. */
export function RunButton() {
  const { m } = useT()
  const cloudId = useFlowStore((s) => s.cloudId)
  const [state, setState] = useState<RunState>('idle')

  if (!cloudId) return null

  const handleRun = async () => {
    if (state === 'running') return
    setState('running')
    try {
      await runCurrentFlow()
      setState('sent')
      setTimeout(() => setState('idle'), 1800)
    } catch (err) {
      setState('idle')
      alert(m.run.error + (err as Error).message)
    }
  }

  return (
    <button
      onClick={handleRun}
      disabled={state === 'running'}
      className="absolute bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-70"
    >
      {state === 'running' ? (
        <Loader2 size={18} className="animate-spin" />
      ) : state === 'sent' ? (
        <Check size={18} />
      ) : (
        <Play size={18} fill="currentColor" />
      )}
      {state === 'running' ? m.run.running : state === 'sent' ? m.run.sent : m.run.run}
    </button>
  )
}
