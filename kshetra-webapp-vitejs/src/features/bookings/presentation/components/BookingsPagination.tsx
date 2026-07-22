import { Icon, IconButton, Select } from '@/shared/ui'

export interface BookingsPaginationProps {
  start: number
  end: number
  total: number
  page: number
  pageCount: number
  pageSize: number
  onPageSizeChange: (size: number) => void
  onPrev: () => void
  onNext: () => void
}

const PAGE_SIZE_OPTIONS = [20, 50, 100].map((n) => ({ value: String(n), label: `${n} / page` }))

/** "Showing X–Y of Z" + rows-per-page select + prev/next page controls. */
export function BookingsPagination({ start, end, total, page, pageCount, pageSize, onPageSizeChange, onPrev, onNext }: BookingsPaginationProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3.5 px-7 pb-5 pt-3.5">
      <span className="text-sm text-ink-subtle">
        Showing {start.toLocaleString('en-IN')}–{end.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')}
      </span>
      <div className="flex-1" />
      <span className="text-sm text-ink-subtle">Rows</span>
      <div className="w-[116px]">
        <Select size="sm" options={PAGE_SIZE_OPTIONS} value={String(pageSize)} onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10) || 20)} />
      </div>
      <div className="flex items-center gap-1">
        <IconButton size="md" theme="default" variant="ghost" className="rounded-md bg-card shadow-xs" label="Previous page" disabled={page <= 0} onClick={onPrev}>
          <Icon name="caret-left" size={15} />
        </IconButton>
        <span className="min-w-[104px] whitespace-nowrap text-center text-sm text-ink">
          Page {page + 1} of {pageCount}
        </span>
        <IconButton size="md" theme="default" variant="ghost" className="rounded-md bg-card shadow-xs" label="Next page" disabled={page >= pageCount - 1} onClick={onNext}>
          <Icon name="caret-right" size={15} />
        </IconButton>
      </div>
    </div>
  )
}
