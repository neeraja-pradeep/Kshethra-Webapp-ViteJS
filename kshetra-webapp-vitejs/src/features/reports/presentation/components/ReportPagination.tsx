import { Icon, IconButton } from '@/shared/ui'

export interface ReportPaginationProps {
  pageInfo: string
  pageLabel: string
  prevDisabled: boolean
  nextDisabled: boolean
  onPrev: () => void
  onNext: () => void
}

/** "Showing X–Y of Z" + prev/next page controls, matching the shell's list-view pagination. */
export function ReportPagination({ pageInfo, pageLabel, prevDisabled, nextDisabled, onPrev, onNext }: ReportPaginationProps) {
  return (
    <div className="flex items-center gap-3.5 px-1 pt-1">
      <span className="text-sm text-ink-subtle">{pageInfo}</span>
      <div className="ml-auto flex items-center gap-2">
        <IconButton label="Previous page" size="sm" className="shadow-xs" disabled={prevDisabled} onClick={onPrev}>
          <Icon name="caret-left" size={15} />
        </IconButton>
        <span className="text-sm text-ink-subtle">{pageLabel}</span>
        <IconButton label="Next page" size="sm" className="shadow-xs" disabled={nextDisabled} onClick={onNext}>
          <Icon name="caret-right" size={15} />
        </IconButton>
      </div>
    </div>
  )
}
