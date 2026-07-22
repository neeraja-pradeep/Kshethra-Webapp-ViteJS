import { Icon, Select } from '@/shared/ui'
import type { SelectOption } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

interface NotificationsPaginationProps {
  pageInfo: string
  pageSize: number
  onPageSizeChange: (size: number) => void
  pageLabel: string
  onPrev: () => void
  onNext: () => void
  prevDisabled: boolean
  nextDisabled: boolean
}

const PAGE_SIZE_OPTIONS: SelectOption[] = [20, 50, 100].map((n) => ({ value: String(n), label: `${n} / page` }))

/** Footer pagination row: result summary, rows-per-page, prev/next controls. */
export function NotificationsPagination({
  pageInfo,
  pageSize,
  onPageSizeChange,
  pageLabel,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
}: NotificationsPaginationProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3.5 px-7 pb-5 pt-3.5">
      <span className="text-sm text-ink-subtle">{pageInfo}</span>
      <div className="flex-1" />
      <span className="text-sm text-ink-subtle">Rows</span>
      <div className="w-[116px]">
        <Select size="sm" options={PAGE_SIZE_OPTIONS} value={String(pageSize)} onChange={(e) => onPageSizeChange(Number(e.target.value) || 20)} />
      </div>
      <div className="flex items-center gap-1">
        <PageButton icon="caret-left" label="Previous page" disabled={prevDisabled} onClick={onPrev} />
        <span className="min-w-[104px] whitespace-nowrap text-center text-sm text-ink">{pageLabel}</span>
        <PageButton icon="caret-right" label="Next page" disabled={nextDisabled} onClick={onNext} />
      </div>
    </div>
  )
}

interface PageButtonProps {
  icon: string
  label: string
  disabled: boolean
  onClick: () => void
}

function PageButton({ icon, label, disabled, onClick }: PageButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border-none bg-card text-ink-muted shadow-xs',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-hover',
      )}
    >
      <Icon name={icon} size={15} />
    </button>
  )
}
