import { useId } from 'react'
import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type SwitchSize = 'sm' | 'md'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'style'> {
  checked?: boolean
  label?: ReactNode
  description?: ReactNode
  size?: SwitchSize
  style?: CSSProperties
}

const SIZES: Record<SwitchSize, { w: number; h: number; knob: number }> = {
  sm: { w: 32, h: 18, knob: 14 },
  md: { w: 40, h: 22, knob: 18 },
}

/** Toggle over a hidden checkbox. */
export function Switch({ checked = false, label, description, size = 'md', disabled = false, id, className, style, ...rest }: SwitchProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const s = SIZES[size]
  const pad = (s.h - s.knob) / 2

  return (
    <label
      htmlFor={fieldId}
      className={cn('inline-flex gap-2.5 font-sans', description ? 'items-start' : 'items-center', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', className)}
      style={style}
    >
      <span className="relative inline-flex shrink-0" style={{ marginTop: description ? 1 : 0 }}>
        <input id={fieldId} type="checkbox" checked={!!checked} disabled={disabled} className="absolute m-0 cursor-[inherit] opacity-0" style={{ width: s.w, height: s.h }} {...rest} />
        <span
          aria-hidden
          className="relative inline-block rounded-full transition-[background] duration-140 ease-ks"
          style={{ width: s.w, height: s.h, background: checked ? 'var(--color-primary)' : 'var(--light-gray-400)' }}
        >
          <span
            className="absolute rounded-full bg-white transition-[left] duration-140 ease-ks"
            style={{ top: pad, left: checked ? s.w - s.knob - pad : pad, width: s.knob, height: s.knob, boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
          />
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
