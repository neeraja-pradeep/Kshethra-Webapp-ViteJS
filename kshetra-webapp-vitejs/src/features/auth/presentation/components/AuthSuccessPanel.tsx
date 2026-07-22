import { Icon, Spinner } from '@/shared/ui'

export interface AuthSuccessPanelProps {
  title: string
  subtitle: string
  hint: string
}

/** Shared success state for every flow — check mark, copy, and a redirect hint. */
export function AuthSuccessPanel({ title, subtitle, hint }: AuthSuccessPanelProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <span className="inline-flex h-[66px] w-[66px] items-center justify-center rounded-full bg-success-surface text-success shadow-[inset_0_0_0_1px_var(--color-success-border)]">
        <Icon name="check-circle" weight="fill" size={38} />
      </span>
      <div>
        <div className="text-xl font-bold tracking-tight text-ink-strong">{title}</div>
        <div className="mt-1.75 text-sm leading-relaxed text-ink-muted">{subtitle}</div>
      </div>
      <div className="mt-0.5 flex items-center gap-2.25 text-xs text-ink-subtle">
        <Spinner size={16} />
        <span>{hint}</span>
      </div>
    </div>
  )
}
