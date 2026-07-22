export interface ReportToastProps {
  message: string
}

/** Bottom-centre confirmation toast, shown briefly after an export completes. */
export function ReportToast({ message }: ReportToastProps) {
  return (
    <div
      role="status"
      className="fixed bottom-7 left-1/2 z-menu -translate-x-1/2 rounded-lg bg-ink-strong px-4.5 py-2.5 font-sans text-sm text-white shadow-lg"
    >
      {message}
    </div>
  )
}
