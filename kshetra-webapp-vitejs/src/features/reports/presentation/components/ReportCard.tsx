import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

import type { ReportDefinition } from '@/features/reports/domain/entities/report'

export interface ReportCardProps {
  report: ReportDefinition
  selected: boolean
  onSelect: (id: ReportDefinition['id']) => void
}

/** One report entry in the catalogue — an accent-tinted tile when selected. */
export function ReportCard({ report, selected, onSelect }: ReportCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(report.id)}
      className={cn(
        'flex w-64 items-start gap-2.75 rounded-2xl px-3.25 py-3 text-left font-sans transition-shadow duration-140 ease-ks hover:shadow-card-hover',
        selected
          ? 'bg-primary-subtle shadow-[inset_0_0_0_1px_var(--color-primary-border),var(--shadow-card)]'
          : 'bg-card shadow-card',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          selected ? 'bg-primary text-white' : 'bg-primary-subtle text-primary',
        )}
      >
        <Icon name={report.icon} size={17} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.75">
        <span className={cn('text-sm font-semibold leading-tight', selected ? 'text-primary-subtle-text' : 'text-ink-strong')}>
          {report.name}
        </span>
        <span className="text-2xs leading-snug text-ink-subtle">{report.description}</span>
        {report.flagged && (
          <span className="inline-flex items-center gap-1 text-2xs font-medium text-warning">
            <Icon name="warning-circle" weight="fill" size={12} />
            Pending data source
          </span>
        )}
      </span>
    </button>
  )
}
