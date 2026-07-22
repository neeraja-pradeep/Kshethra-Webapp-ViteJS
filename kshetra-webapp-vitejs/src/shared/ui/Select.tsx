import { useId, useState } from 'react'
import type { CSSProperties, ReactNode, SelectHTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

export type SelectSize = 'sm' | 'md' | 'lg'
export type SelectVariant = 'outline' | 'subtle'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'style'> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  size?: SelectSize
  variant?: SelectVariant
  options?: SelectOption[]
  placeholder?: string
  containerStyle?: CSSProperties
  style?: CSSProperties
  children?: ReactNode
}

const FIELD: Record<SelectSize, string> = {
  sm: 'h-7 text-sm rounded-md',
  md: 'h-8 text-base rounded-lg',
  lg: 'h-10 text-lg rounded-lg',
}
const PAD: Record<SelectSize, string> = { sm: 'px-2', md: 'px-2.5', lg: 'px-3' }

function ringShadow(focus: boolean, hasError: boolean, variant: SelectVariant): string {
  const ring = hasError
    ? 'var(--color-danger)'
    : focus
      ? 'var(--color-primary)'
      : variant === 'subtle'
        ? 'transparent'
        : 'var(--border-default)'
  let shadow = `0 0 0 1px ${ring}`
  if (focus && !hasError) shadow += ', var(--shadow-focus)'
  return shadow
}

/** Native select styled to match Input, with a custom caret. */
export function Select({
  label,
  hint,
  error,
  size = 'md',
  variant = 'outline',
  options,
  placeholder,
  disabled = false,
  required = false,
  id,
  containerStyle,
  style,
  onFocus,
  onBlur,
  children,
  ...rest
}: SelectProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const [focus, setFocus] = useState(false)
  const hasError = !!error
  const bg = variant === 'subtle' ? 'var(--light-gray-100)' : 'var(--surface-card)'

  return (
    <div className="flex flex-col gap-1.5 font-sans" style={containerStyle}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <div
        className={cn('relative flex items-center box-border transition-shadow duration-120 ease-ks', FIELD[size], disabled && 'opacity-60')}
        style={{ background: bg, boxShadow: ringShadow(focus, hasError, variant), ...style }}
      >
        <select
          id={fieldId}
          disabled={disabled}
          required={required}
          onFocus={(e) => {
            setFocus(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocus(false)
            onBlur?.(e)
          }}
          className={cn(
            'h-full w-full appearance-none border-none bg-transparent pr-7.5 text-ink-strong outline-none [font-family:inherit] [font-size:inherit]',
            PAD[size],
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>) : children}
        </select>
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute right-2.25 text-ink-subtle">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {(hint || error) && (
        <span className={cn('text-2xs font-medium', hasError ? 'text-danger' : 'text-ink-subtle')}>{error || hint}</span>
      )}
    </div>
  )
}
