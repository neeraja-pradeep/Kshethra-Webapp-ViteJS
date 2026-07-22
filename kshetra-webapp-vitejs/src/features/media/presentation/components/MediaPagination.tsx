import { Icon, Select } from '@/shared/ui'
import type { SelectOption } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

const PAGE_SIZES = [20, 50, 100]
const PAGE_SIZE_OPTIONS: SelectOption[] = PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} / page` }))

const NAV_BUTTON = 'inline-flex h-8 w-8 items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs'

interface MediaPaginationProps {
  pageInfo: string
  pageSize: number
  onPageSizeChange: (size: number) => void
  pageLabel: string
  prevDisabled: boolean
  nextDisabled: boolean
  onPrev: () => void
  onNext: () => void
}

/** "Showing X–Y of Z", rows-per-page select, and prev/next page controls. */
export function MediaPagination({
  pageInfo,
  pageSize,
  onPageSizeChange,
  pageLabel,
  prevDisabled,
  nextDisabled,
  onPrev,
  onNext,
}: MediaPaginationProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3.5 px-7 pb-5 pt-3.5">
      <span className="text-sm text-ink-subtle">{pageInfo}</span>
      <div className="flex-1" />
      <span className="text-sm text-ink-subtle">Rows</span>
      <div style={{ width: 116 }}>
        <Select
          size="sm"
          options={PAGE_SIZE_OPTIONS}
          value={String(pageSize)}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10) || 20)}
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={prevDisabled}
          aria-label="Previous page"
          className={cn(NAV_BUTTON, prevDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-hover')}
        >
          <Icon name="caret-left" size={15} />
        </button>
        <span className="min-w-26 whitespace-nowrap text-center text-sm text-ink">{pageLabel}</span>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          aria-label="Next page"
          className={cn(NAV_BUTTON, nextDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-hover')}
        >
          <Icon name="caret-right" size={15} />
        </button>
      </div>
    </div>
  )
}
