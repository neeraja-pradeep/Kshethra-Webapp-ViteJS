import { useId, useState } from 'react'
import type { CSSProperties, ReactNode, TextareaHTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

export type TextareaVariant = 'outline' | 'subtle'

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  variant?: TextareaVariant
  containerStyle?: CSSProperties
  style?: CSSProperties
}

function ringShadow(focus: boolean, hasError: boolean, variant: TextareaVariant): string {
  const ring = hasError
    ? 'var(--color-danger)'
    : focus
      ? 'var(--color-primary)'
      : variant === 'subtle'
        ? 'transparent'
        : 'var(--border-default)'
  let shadow = `0 0 0 1px ${ring}`
  if (focus) shadow += hasError ? ', 0 0 0 3px color-mix(in srgb, var(--color-danger) 22%, transparent)' : ', var(--shadow-focus)'
  return shadow
}

/** Multi-line text field, mirrors Input's anatomy. */
export function Textarea({
  label,
  hint,
  error,
  variant = 'outline',
  rows = 4,
  disabled = false,
  required = false,
  id,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextareaProps) {
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
      <textarea
        id={fieldId}
        rows={rows}
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
          'box-border w-full resize-y rounded-lg border-none px-2.5 py-2 text-base font-normal leading-normal tracking-normal text-ink-strong outline-none [font-family:inherit] transition-shadow duration-120 ease-ks',
          disabled && 'opacity-60',
        )}
        style={{ background: bg, boxShadow: ringShadow(focus, hasError, variant), ...style }}
        {...rest}
      />
      {(hint || error) && (
        <span className={cn('text-2xs font-medium', hasError ? 'text-danger' : 'text-ink-subtle')}>{error || hint}</span>
      )}
    </div>
  )
}
