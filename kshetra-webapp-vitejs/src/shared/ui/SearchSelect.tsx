import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import { Spinner } from './Spinner'
import type { SelectOption, SelectSize } from './Select'

export interface SearchSelectProps {
  options: readonly SelectOption[]
  /** The selected option's value, or '' for none. */
  value: string
  onChange: (value: string) => void
  /** Raw text the operator typed. Lift it to run the search server-side. */
  search: string
  onSearchChange: (search: string) => void
  placeholder?: string
  /** Shown in the list while the server is answering a new term. */
  loading?: boolean
  emptyLabel?: string
  size?: SelectSize
  disabled?: boolean
  label?: ReactNode
  containerStyle?: CSSProperties
}

const FIELD: Record<SelectSize, string> = {
  sm: 'h-7 text-sm rounded-md',
  md: 'h-8 text-base rounded-lg',
  lg: 'h-10 text-lg rounded-lg',
}
const PAD: Record<SelectSize, string> = { sm: 'px-2', md: 'px-2.5', lg: 'px-3' }

/**
 * A select whose options are searched rather than scrolled.
 *
 * The native `<select>` cannot hold a text box, and these lists are the case
 * that needs one: the labels are Malayalam while the counter types English, so
 * matching is the server's job and the control only has to carry the term to
 * it. `search` is lifted for exactly that reason — the caller debounces it and
 * queries, and passes back whatever the server matched.
 *
 * While the box is closed it shows the *selected label*, not the search term:
 * a picker that reads back what you typed rather than what you chose is how a
 * counter rings up the wrong star.
 *
 * The list is rendered through a portal and positioned against the viewport.
 * It has to be: the panels these sit in are `overflow-hidden` for their rounded
 * corners and scroll on their own, and any such ancestor clips an absolutely
 * positioned child — the dropdown was being cut to a single visible row.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  search,
  onSearchChange,
  placeholder = 'Select',
  loading = false,
  emptyLabel = 'No matches',
  size = 'md',
  disabled = false,
  label,
  containerStyle,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(false)
  const [active, setActive] = useState(0)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number; drop: 'down' | 'up' } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selected = options.find((o) => o.value === value) ?? null
  // The selected row can sit outside the current matches — it was chosen under
  // an earlier term — so its label is remembered rather than looked up again.
  const [selectedLabel, setSelectedLabel] = useState(selected?.label ?? '')
  useEffect(() => {
    if (selected) setSelectedLabel(selected.label)
    else if (!value) setSelectedLabel('')
  }, [selected, value])

  const MAX_LIST_H = 240
  const GAP = 4
  /** Below this the list is too short to be worth reading; scroll it instead. */
  const MIN_LIST_H = 120

  /** Anchor the portalled list to the field's current viewport position. */
  const measure = useCallback(() => {
    const field = fieldRef.current
    if (!field) return
    const r = field.getBoundingClientRect()
    const below = window.innerHeight - r.bottom - GAP
    const above = r.top - GAP
    // Flip above only when below is genuinely too cramped AND above is roomier —
    // a list opening upward near the top of the screen is worse than a short
    // one below.
    const drop = below < MIN_LIST_H && above > below ? 'up' : 'down'
    // The height is clamped to the side actually chosen. Without this the list
    // kept its full 240px and ran past the edge it was flipped away from.
    const height = Math.max(0, Math.min(MAX_LIST_H, drop === 'down' ? below : above))
    setRect({ top: drop === 'down' ? r.bottom + GAP : r.top - GAP, left: r.left, width: r.width, height, drop })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    measure()
  }, [open, measure])

  // The field can move under a scrolling panel while the list is open, so the
  // list follows it. `capture` catches scrolls on those inner panels too, not
  // just the window.
  useEffect(() => {
    if (!open) return
    const onMove = () => measure()
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open, measure])

  // Pointer-down, not click: closing on click would fire after the option's own
  // handler had already been skipped by the input losing focus. The list lives
  // in a portal, so it is checked separately — it is not inside `rootRef`.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
      onSearchChange('')
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, onSearchChange])

  useEffect(() => {
    setActive(0)
  }, [search, options])

  function openList() {
    if (disabled) return
    setOpen(true)
    // The term is cleared so the full list is in reach again — reopening on the
    // last search would hide every other star behind a term already chosen.
    onSearchChange('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function choose(option: SelectOption) {
    onChange(option.value)
    setSelectedLabel(option.label)
    setOpen(false)
    onSearchChange('')
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault()
      openList()
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const option = options[active]
      if (option) choose(option)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      onSearchChange('')
    }
  }

  const ring = focus || open ? 'var(--color-primary)' : 'var(--border-default)'
  const shadow = `0 0 0 1px ${ring}${focus || open ? ', var(--shadow-focus)' : ''}`

  return (
    <div className="relative flex flex-col gap-1.5 font-sans" ref={rootRef} style={containerStyle}>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
      <div
        ref={fieldRef}
        className={cn('relative flex items-center box-border transition-shadow duration-120 ease-ks', FIELD[size], disabled && 'opacity-60')}
        style={{ background: 'var(--surface-card)', boxShadow: shadow }}
      >
        {open ? (
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            value={search}
            placeholder={selectedLabel || placeholder}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            className={cn(
              'h-full w-full appearance-none border-none bg-transparent pr-7.5 text-ink-strong outline-none [font-family:inherit] [font-size:inherit] placeholder:text-ink-subtle',
              PAD[size],
            )}
          />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={openList}
            onKeyDown={onKeyDown}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            className={cn(
              'flex h-full w-full items-center border-none bg-transparent pr-7.5 text-left outline-none [font-family:inherit] [font-size:inherit]',
              PAD[size],
              selectedLabel ? 'text-ink-strong' : 'text-ink-subtle',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer',
            )}
          >
            <span className="truncate">{selectedLabel || placeholder}</span>
          </button>
        )}
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute right-2.25 text-ink-subtle">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && rect && createPortal(
        <div
          id={listId}
          role="listbox"
          ref={listRef}
          style={{
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            maxHeight: rect.height,
            ...(rect.drop === 'down' ? { top: rect.top } : { bottom: window.innerHeight - rect.top }),
          }}
          className="z-[200] overflow-y-auto overscroll-contain rounded-lg border border-stroke bg-card py-1 shadow-xl"
        >
          {loading && options.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-ink-subtle">
              <Spinner size={14} />
              Searching…
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-3 text-sm text-ink-subtle">{emptyLabel}</div>
          ) : (
            options.map((o, i) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                // Pointer-down beats the input's blur, which would otherwise
                // close the list before the click ever landed.
                onPointerDown={(e) => {
                  e.preventDefault()
                  choose(o)
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex w-full items-center border-none bg-transparent px-3 py-1.5 text-left text-sm outline-none',
                  i === active ? 'bg-hover' : 'bg-transparent',
                  o.value === value ? 'font-semibold text-primary' : 'text-ink-strong',
                )}
              >
                <span className="truncate">{o.label}</span>
              </button>
            ))
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
