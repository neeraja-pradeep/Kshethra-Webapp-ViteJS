import { useId } from 'react'
import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type CheckboxSize = 'sm' | 'md'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'style'> {
  checked?: boolean
  indeterminate?: boolean
  label?: ReactNode
  description?: ReactNode
  size?: CheckboxSize
  style?: CSSProperties
}

const BOX: Record<CheckboxSize, number> = { sm: 16, md: 18 }

/** Custom-drawn checkbox over a visually-hidden native input. */
export function Checkbox({
  checked = false,
  indeterminate = false,
  label,
  description,
  size = 'md',
  disabled = false,
  id,
  className,
  style,
  ...rest
}: CheckboxProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const box = BOX[size]
  const on = checked || indeterminate

  return (
    <label
      htmlFor={fieldId}
      className={cn('inline-flex gap-2 font-sans', description ? 'items-start' : 'items-center', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', className)}
      style={style}
    >
      <span className="relative inline-flex shrink-0" style={{ marginTop: description ? 1 : 0 }}>
        <input
          id={fieldId}
          type="checkbox"
          checked={!!checked}
          disabled={disabled}
          ref={(el) => {
            if (el) el.indeterminate = indeterminate
          }}
          className="absolute m-0 cursor-[inherit] opacity-0"
          style={{ width: box, height: box }}
          {...rest}
        />
        <span
          aria-hidden
          className="inline-flex items-center justify-center rounded-sm text-white transition-[background,box-shadow] duration-120 ease-ks"
          style={{
            width: box,
            height: box,
            background: on ? 'var(--color-primary)' : 'var(--surface-card)',
            boxShadow: on ? 'none' : '0 0 0 1px var(--border-strong)',
          }}
        >
          {indeterminate ? (
            <svg width={box - 6} height={box - 6} viewBox="0 0 12 12">
              <rect x={2} y={5} width={8} height={2} rx={1} fill="currentColor" />
            </svg>
          ) : checked ? (
            <svg width={box - 4} height={box - 4} viewBox="0 0 14 14" fill="none">
              <path d="M3 7.5l2.5 2.5L11 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
      </span>
      {(label || description) && (
        <span className="flex flex-col gap-0.5">
          {label && <span className="text-base leading-tight text-ink">{label}</span>}
          {description && <span className="text-xs text-ink-subtle">{description}</span>}
        </span>
      )}
    </label>
  )
}
