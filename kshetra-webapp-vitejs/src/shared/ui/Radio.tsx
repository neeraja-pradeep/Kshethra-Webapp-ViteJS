import { useId } from 'react'
import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type RadioSize = 'sm' | 'md'

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'style'> {
  checked?: boolean
  label?: ReactNode
  description?: ReactNode
  size?: RadioSize
  style?: CSSProperties
}

const BOX: Record<RadioSize, number> = { sm: 16, md: 18 }

/** Custom-drawn radio over a visually-hidden native input. */
export function Radio({ checked = false, label, description, size = 'md', disabled = false, id, className, style, ...rest }: RadioProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const box = BOX[size]

  return (
    <label
      htmlFor={fieldId}
      className={cn('inline-flex gap-2 font-sans', description ? 'items-start' : 'items-center', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', className)}
      style={style}
    >
      <span className="relative inline-flex shrink-0" style={{ marginTop: description ? 1 : 0 }}>
        <input id={fieldId} type="radio" checked={!!checked} disabled={disabled} className="absolute m-0 cursor-[inherit] opacity-0" style={{ width: box, height: box }} {...rest} />
        <span
          aria-hidden
          className="inline-flex items-center justify-center rounded-full transition-[box-shadow] duration-120 ease-ks"
          style={{
            width: box,
            height: box,
            background: 'var(--surface-card)',
            boxShadow: checked ? 'inset 0 0 0 5px var(--color-primary)' : 'inset 0 0 0 1px var(--border-strong)',
          }}
        />
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
