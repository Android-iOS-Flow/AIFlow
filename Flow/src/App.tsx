import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Loader2 } from 'lucide-react'
import { Toolbar } from './components/Toolbar/Toolbar'
import { Sidebar } from './components/Sidebar/Sidebar'
import { FlowCanvas } from './components/FlowCanvas/FlowCanvas'
import { NodeInspector } from './components/panel/NodeInspector'
import { LoginPage } from './components/Auth/LoginPage'
import { FlowsModal } from './components/Cloud/FlowsModal'
import { CanvasGate } from './components/Cloud/CanvasGate'
import { RestoreDraftDialog } from './components/Cloud/RestoreDraftDialog'
import { RunButton } from './components/Run/RunButton'
import { useThemeStore } from './theme/themeStore'
import { useAuthStore } from './auth/authStore'
import { useFlowStore } from './store/flowStore'
import { useUiStore } from './store/uiStore'
import { toDocument, saveDraft } from './lib/flowIo'
import { openCloudFlow, saveCurrentToCloud } from './lib/cloudActions'

export default function App() {
  const theme = useThemeStore((s) => s.theme)
  const init = useAuthStore((s) => s.init)
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)

  // dark mode <-> <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Khởi tạo phiên đăng nhập
  useEffect(() => init(), [init])

  // Mở link chia sẻ ?flow=<id>
  useEffect(() => {
    if (!session) return
    const flowId = new URLSearchParams(window.location.search).get('flow')
    if (!flowId) return
    openCloudFlow(flowId, (d) => useUiStore.getState().requestRestore(d.savedAt)).catch(() => {
      /* không có quyền / không tồn tại -> bỏ qua */
    })
  }, [session])

  // Tự lưu BẢN NHÁP vào localStorage mỗi 10 giây (khi đang mở 1 flow)
  useEffect(() => {
    if (!session) return
    const timer = setInterval(() => {
      const s = useFlowStore.getState()
      if (s.cloudId) saveDraft(s.cloudId, toDocument(s.nodes, s.edges, s.globals))
    }, 10_000)
    return () => clearInterval(timer)
  }, [session])

  // Ctrl/Cmd + S -> lưu lên database
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveCurrentToCloud()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <Loader2 size={28} className="animate-spin text-sky-600 dark:text-sky-400" />
      </div>
    )
  }

  if (!session) return <LoginPage />

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col bg-slate-100 dark:bg-slate-950">
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="relative min-w-0 flex-1">
            <FlowCanvas />
            <RunButton />
            <CanvasGate />
          </main>
          <NodeInspector />
        </div>
      </div>
      <FlowsModal />
      <RestoreDraftDialog />
    </ReactFlowProvider>
  )
}
