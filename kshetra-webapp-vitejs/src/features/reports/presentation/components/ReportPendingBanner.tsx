import { Icon } from '@/shared/ui'

export interface ReportPendingBannerProps {
  note: string
}

/** Warns that a flagged report's data source is not defined yet. */
export function ReportPendingBanner({ note }: ReportPendingBannerProps) {
  return (
    <div className="flex items-start gap-2.25 rounded-lg bg-warning-surface px-3.5 py-2.75 text-xs leading-snug text-ink shadow-[inset_0_0_0_1px_var(--color-warning-border)]">
      <Icon name="warning-circle" weight="fill" size={16} color="var(--color-warning)" className="mt-0.5 shrink-0" />
      {note}
    </div>
  )
}
