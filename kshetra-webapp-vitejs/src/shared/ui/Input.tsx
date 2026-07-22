import { useId, useState } from 'react'
import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type InputSize = 'sm' | 'md' | 'lg'
export type InputVariant = 'outline' | 'subtle'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'style'> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  size?: InputSize
  variant?: InputVariant
  prefix?: ReactNode
  suffix?: ReactNode
  containerStyle?: CSSProperties
  style?: CSSProperties
}

const FIELD: Record<InputSize, string> = {
  sm: 'h-7 px-2 text-sm gap-1.5 rounded-md',
  md: 'h-8 px-2.5 text-base gap-2 rounded-lg',
  lg: 'h-10 px-3 text-lg gap-2 rounded-lg',
}

function ringShadow(focus: boolean, hasError: boolean, variant: InputVariant): string {
  const ring = hasError
    ? 'var(--color-danger)'
    : focus
      ? 'var(--color-primary)'
      : variant === 'subtle'
        ? 'transparent'
        : 'var(--border-default)'
  let shadow = `0 0 0 1px ${ring}`
  if (focus && !hasError) shadow += ', var(--shadow-focus)'
  if (focus && hasError) shadow += ', 0 0 0 3px color-mix(in srgb, var(--color-danger) 22%, transparent)'
  return shadow
}

/** Single-line text field with label / hint / error / prefix / suffix. */
export function Input({
  label,
  hint,
  error,
  size = 'md',
  variant = 'outline',
  prefix,
  suffix,
  disabled = false,
  required = false,
  id,
  className,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const [focus, setFocus] = useState(false)
  const hasError = !!error
  const bg = variant === 'subtle' ? 'var(--light-gray-100)' : disabled ? 'var(--light-gray-50)' : 'var(--surface-card)'

  return (
    <div className={cn('flex flex-col gap-1.5 font-sans', className)} style={containerStyle}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <div
        className={cn('flex items-center box-border transition-shadow duration-120 ease-ks', FIELD[size], disabled && 'opacity-60')}
        style={{ background: bg, boxShadow: ringShadow(focus, hasError, variant), ...style }}
      >
        {prefix && <span className="inline-flex shrink-0 text-ink-subtle">{prefix}</span>}
        <input
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
          className="min-w-0 flex-1 border-none bg-transparent font-normal tracking-normal text-ink-strong outline-none [font-family:inherit] [font-size:inherit]"
          {...rest}
        />
        {suffix && <span className="inline-flex shrink-0 text-ink-subtle">{suffix}</span>}
      </div>
      {(hint || error) && (
        <span className={cn('text-2xs font-medium', hasError ? 'text-danger' : 'text-ink-subtle')}>{error || hint}</span>
      )}
    </div>
  )
}
