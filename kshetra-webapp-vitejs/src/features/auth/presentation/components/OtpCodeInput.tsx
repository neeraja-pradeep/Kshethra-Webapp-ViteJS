import { useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'

import { cn } from '@/shared/lib/cn'

const LENGTH = 6

export interface OtpCodeInputProps {
  value: string
  hasError?: boolean
  disabled?: boolean
  onChange: (value: string) => void
}

/** Six-box one-time-code entry backed by a single invisible numeric input. */
export function OtpCodeInput({ value, hasError = false, disabled = false, onChange }: OtpCodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 40)
    return () => clearTimeout(id)
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, LENGTH)
    onChange(digits)
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        {Array.from({ length: LENGTH }, (_, i) => {
          const filled = i < value.length
          const active = i === value.length && !disabled
          return (
            <div
              key={i}
              className={cn(
                'flex h-[58px] flex-1 items-center justify-center rounded-2xl text-2xl font-bold tabular-nums text-ink-strong transition-[box-shadow,background] duration-120 ease-ks',
                hasError
                  ? 'bg-danger-surface text-danger shadow-[inset_0_0_0_1.5px_var(--color-danger)]'
                  : filled
                    ? 'bg-card shadow-[inset_0_0_0_1px_var(--border-default)]'
                    : 'bg-sunken shadow-[inset_0_0_0_1px_var(--border-default)]',
                active && !hasError && 'shadow-[inset_0_0_0_2px_var(--color-primary)]',
              )}
            >
              {value[i] ?? (active ? <span className="h-6.5 w-0.5 animate-pulse rounded-sm bg-primary" /> : null)}
            </div>
          )
        })}
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        aria-label="6-digit verification code"
        className="absolute inset-0 h-full w-full cursor-text border-none bg-transparent font-[inherit] tracking-[2em] opacity-0"
      />
    </div>
  )
}
