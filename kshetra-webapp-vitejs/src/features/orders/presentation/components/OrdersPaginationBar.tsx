import { Icon, Select, type SelectOption } from '@/shared/ui'

export interface OrdersPaginationBarProps {
  pageInfo: string
  pageSizeOptions: readonly SelectOption[]
  pageSize: number
  onPageSizeChange: (size: number) => void
  pageLabel: string
  prevDisabled: boolean
  nextDisabled: boolean
  onPrev: () => void
  onNext: () => void
}

/** "Showing X-Y of Z" + rows-per-page select + prev/next page controls. */
export function OrdersPaginationBar({
  pageInfo,
  pageSizeOptions,
  pageSize,
  onPageSizeChange,
  pageLabel,
  prevDisabled,
  nextDisabled,
  onPrev,
  onNext,
}: OrdersPaginationBarProps) {
  return (
    <div className="flex items-center gap-3.5 px-7 pb-5 pt-3.5">
      <span className="text-sm text-ink-subtle">{pageInfo}</span>
      <div className="flex-1" />
      <span className="text-sm text-ink-subtle">Rows</span>
      <div className="w-[116px]">
        <Select size="sm" options={pageSizeOptions as SelectOption[]} value={String(pageSize)} onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10) || 20)} />
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={prevDisabled}
          aria-label="Previous page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="caret-left" size={15} />
        </button>
        <span className="min-w-[104px] whitespace-nowrap text-center text-sm text-ink">{pageLabel}</span>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          aria-label="Next page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="caret-right" size={15} />
        </button>
      </div>
    </div>
  )
}
