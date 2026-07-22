import { cn } from '@/shared/lib/cn'
import { Icon, Select } from '@/shared/ui'

const PAGE_SIZE_OPTIONS = [20, 50, 100].map((n) => ({ value: String(n), label: `${n} / page` }))

export interface DevoteesPaginationProps {
  total: number
  page: number
  pageCount: number
  pageSize: number
  onPageSizeChange: (size: number) => void
  onPrev: () => void
  onNext: () => void
}

/** "Showing X–Y of Z" + rows-per-page select + prev/next controls. */
export function DevoteesPagination({ total, page, pageCount, pageSize, onPageSizeChange, onPrev, onNext }: DevoteesPaginationProps) {
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  const info = total ? `Showing ${from}–${to} of ${total} devotees` : 'No devotees'

  return (
    <div className="flex shrink-0 items-center gap-3.5 px-7 pb-5 pt-3.5">
      <span className="text-sm text-ink-subtle">{info}</span>
      <div className="flex-1" />
      <span className="text-sm text-ink-subtle">Rows</span>
      <div className="w-[116px]">
        <Select
          size="sm"
          options={PAGE_SIZE_OPTIONS}
          value={String(pageSize)}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10) || 20)}
          containerStyle={{ width: '100%' }}
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 0}
          aria-label="Previous page"
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs hover:bg-hover',
            page <= 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          )}
        >
          <Icon name="caret-left" size={15} />
        </button>
        <span className="min-w-[104px] whitespace-nowrap text-center text-sm text-ink">
          Page {page + 1} of {pageCount}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= pageCount - 1}
          aria-label="Next page"
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs hover:bg-hover',
            page >= pageCount - 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          )}
        >
          <Icon name="caret-right" size={15} />
        </button>
      </div>
    </div>
  )
}
