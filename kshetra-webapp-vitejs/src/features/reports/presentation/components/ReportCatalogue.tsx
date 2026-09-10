import { ReportCard } from '@/features/reports/presentation/components/ReportCard'

import type { ReportDefinition, ReportGroup } from '@/features/reports/domain/entities/report'

export interface ReportCatalogueProps {
  groups: readonly ReportGroup[]
  /** Every report, looked up by the slugs each group lists. */
  reports: readonly ReportDefinition[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
}

/**
 * The report picker — one labelled section per group. Both the grouping and the
 * order are the server's; a group whose reports the caller cannot see renders
 * nothing rather than being invented here.
 *
 * A grid rather than wrapped flex: the groups hold one to four reports each, and
 * free wrapping left every section with its own ragged column positions. The
 * columns are shared, so cards line up down the page however many a group has.
 */
export function ReportCatalogue({ groups, reports, selectedSlug, onSelect }: ReportCatalogueProps) {
  const bySlug = new Map(reports.map((report) => [report.slug, report]))

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        const groupReports = group.reportSlugs.flatMap((slug) => {
          const report = bySlug.get(slug)
          return report ? [report] : []
        })
        if (groupReports.length === 0) return null
        return (
          <section key={group.key} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <h2 className="m-0 text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                {group.label}
              </h2>
              {/* A hairline carrying the eye across the row, so each group reads
                  as a band rather than a floating label above loose cards. */}
              <div className="h-px flex-1 bg-stroke-subtle" />
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-3">
              {groupReports.map((report) => (
                <ReportCard
                  key={report.slug}
                  report={report}
                  selected={report.slug === selectedSlug}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
