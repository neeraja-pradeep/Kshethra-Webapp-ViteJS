import { Icon } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

import type { ReportDefinition } from '@/features/reports/domain/entities/report'
import { reportIconName } from '@/features/reports/presentation/lib/reportIcons'

export interface ReportCardProps {
  report: ReportDefinition
  selected: boolean
  onSelect: (slug: string) => void
}

/**
 * One report entry in the catalogue.
 *
 * The card fills its grid cell rather than sizing to its text, and the
 * description is clamped to two lines — the server writes them at wildly
 * different lengths, and letting each card grow to fit made every row a
 * different height.
 */
export function ReportCard({ report, selected, onSelect }: ReportCardProps) {
  return (
    <button
      type="button"
      disabled={!report.permitted}
      onClick={() => onSelect(report.slug)}
      title={report.description}
      aria-pressed={selected}
      className={cn(
        'group relative flex h-full w-full flex-col gap-2.5 rounded-2xl p-3.5 text-left font-sans',
        'transition-[box-shadow,transform,background-color] duration-140 ease-ks',
        report.permitted
          ? 'hover:-translate-y-px hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          : 'cursor-not-allowed opacity-55',
        selected
          ? 'bg-primary-subtle shadow-[inset_0_0_0_1.5px_var(--color-primary)]'
          : 'bg-card shadow-card',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-140 ease-ks',
          selected ? 'bg-primary text-white' : 'bg-primary-subtle text-primary',
        )}
      >
        <Icon name={reportIconName(report.icon)} size={18} />
      </span>

      <span className="flex min-w-0 flex-col gap-1">
        <span
          className={cn(
            'text-sm font-semibold leading-snug',
            selected ? 'text-primary-subtle-text' : 'text-ink-strong',
          )}
        >
          {report.label}
        </span>
        {/* Clamped, with the full text on the title attribute above. */}
        <span className="line-clamp-2 text-2xs leading-relaxed text-ink-subtle">{report.description}</span>
      </span>

      {/* The catalogue never lists a report that would 403, so this is rare —
          a custom role given the screen but not what one report reads. */}
      {!report.permitted && (
        <span className="mt-auto inline-flex items-center gap-1 text-2xs font-medium text-warning">
          <Icon name="lock-simple" weight="fill" size={12} />
          Not available to your role
        </span>
      )}
    </button>
  )
}
