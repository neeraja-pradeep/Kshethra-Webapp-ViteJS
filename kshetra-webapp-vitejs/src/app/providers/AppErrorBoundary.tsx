import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

/**
 * Last line of defence so one crashed screen doesn't take the whole console
 * down mid-shift. Recovery is a reload — there is no safe partial state to
 * resume a half-rendered till from.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // No logger in the project yet; surface it where a developer will see it
    // without shipping user data anywhere.
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-sunken p-8 text-center">
        <h1 className="m-0 text-2xl font-heading tracking-title text-ink-strong">Something went wrong</h1>
        <p className="m-0 max-w-md text-sm text-ink-muted">
          The screen stopped responding. Reloading usually clears it; any completed sale is already saved on the server.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"
        >
          Reload
        </button>
      </div>
    )
  }
}
