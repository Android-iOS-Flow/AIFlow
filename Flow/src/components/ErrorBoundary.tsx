import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Bắt lỗi render để hiện thông báo thay vì màn hình trắng/tối khó hiểu. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-100 p-6 text-center dark:bg-slate-950">
          <h1 className="text-lg font-bold text-rose-600 dark:text-rose-400">Đã xảy ra lỗi</h1>
          <pre className="max-w-lg overflow-auto rounded-md bg-white p-3 text-left text-xs text-slate-600 shadow dark:bg-slate-900 dark:text-slate-300">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => location.reload()}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Tải lại trang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
