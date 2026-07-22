import { Icon, Select } from '@/shared/ui'

const PAGE_SIZES = [20, 50, 100]

export interface ListPaginationProps {
  /** Total filtered row count. */
  total: number
  /** 0-based current page. */
  page: number
  pageSize: number
  /** Plural noun for the count line, e.g. "orders". */
  itemLabel: string
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

/** Shared "Showing X–Y of Z" + rows-per-page + prev/next footer for list screens. */
export function ListPagination({ total, page, pageSize, itemLabel, onPageChange, onPageSizeChange }: ListPaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages - 1)
  const from = current * pageSize + 1
  const to = Math.min(total, (current + 1) * pageSize)

  return (
    <div className="flex flex-shrink-0 items-center gap-3.5 px-7 pb-5 pt-3.5">
      <span className="text-sm text-ink-subtle">{total ? `Showing ${from}–${to} of ${total} ${itemLabel}` : `No ${itemLabel}`}</span>
      <div className="flex-1" />
      <span className="text-sm text-ink-subtle">Rows</span>
      <div className="w-[116px]">
        <Select
          size="sm"
          value={String(pageSize)}
          options={PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} / page` }))}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10) || 20)}
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={current <= 0}
          onClick={() => onPageChange(current - 1)}
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="caret-left" size={15} />
        </button>
        <span className="min-w-[104px] whitespace-nowrap text-center text-sm text-ink">
          Page {current + 1} of {pages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={current >= pages - 1}
          onClick={() => onPageChange(current + 1)}
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="caret-right" size={15} />
        </button>
      </div>
    </div>
  )
}
