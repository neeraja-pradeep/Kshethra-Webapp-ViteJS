import { ReportCard } from '@/features/reports/presentation/components/ReportCard'

import type { ReportGroup, ReportId } from '@/features/reports/domain/entities/report'

export interface ReportCatalogueProps {
  groups: readonly ReportGroup[]
  selectedId: ReportId
  onSelect: (id: ReportId) => void
}

/** The report picker — one overline-labelled section per category, cards wrap within. */
export function ReportCatalogue({ groups, selectedId, onSelect }: ReportCatalogueProps) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-2">
          <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{group.category}</div>
          <div className="flex flex-wrap gap-2.5">
            {group.reports.map((report) => (
              <ReportCard key={report.id} report={report} selected={report.id === selectedId} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
