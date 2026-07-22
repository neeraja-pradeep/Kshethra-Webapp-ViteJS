import type { ChangeEvent } from 'react'

import { Icon, Select } from '@/shared/ui'

const PAGE_SIZE_OPTIONS = [20, 50, 100].map((n) => ({ value: String(n), label: `${n} / page` }))

export interface AgentCodePaginationProps {
  pageInfo: string
  pageSize: number
  onPageSizeChange: (size: number) => void
  pageLabel: string
  onPrev: () => void
  onNext: () => void
  prevDisabled: boolean
  nextDisabled: boolean
}

/** Result count, page-size select, and prev/next controls under the table. */
export function AgentCodePagination({ pageInfo, pageSize, onPageSizeChange, pageLabel, onPrev, onNext, prevDisabled, nextDisabled }: AgentCodePaginationProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3.5 px-7 pb-5 pt-3.5">
      <span className="text-sm text-ink-subtle">{pageInfo}</span>
      <div className="flex-1" />
      <span className="text-sm text-ink-subtle">Rows</span>
      <div className="w-[116px]">
        <Select
          size="sm"
          options={PAGE_SIZE_OPTIONS}
          value={String(pageSize)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onPageSizeChange(parseInt(e.target.value, 10) || 20)}
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={prevDisabled}
          onClick={onPrev}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs disabled:cursor-not-allowed disabled:opacity-50 enabled:cursor-pointer enabled:hover:bg-hover"
        >
          <Icon name="caret-left" size={15} />
        </button>
        <span className="min-w-[104px] whitespace-nowrap text-center text-sm text-ink">{pageLabel}</span>
        <button
          type="button"
          aria-label="Next page"
          disabled={nextDisabled}
          onClick={onNext}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs disabled:cursor-not-allowed disabled:opacity-50 enabled:cursor-pointer enabled:hover:bg-hover"
        >
          <Icon name="caret-right" size={15} />
        </button>
      </div>
    </div>
  )
}
