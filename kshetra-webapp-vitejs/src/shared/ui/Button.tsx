import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import { Spinner } from './Spinner'

export type ButtonTheme = 'primary' | 'default' | 'danger'
export type ButtonVariant = 'solid' | 'subtle' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  children?: ReactNode
  theme?: ButtonTheme
  variant?: ButtonVariant
  size?: ButtonSize
  iconLeft?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
  fullWidth?: boolean
  style?: CSSProperties
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-sm gap-1.5 rounded-md',
  md: 'h-8 px-3 text-base gap-1.5 rounded-md',
  lg: 'h-10 px-4 text-lg gap-2 rounded-lg',
  xl: 'h-12 px-5.5 text-xl gap-2 rounded-lg',
}
const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18, xl: 20 }

const PALETTE: Record<ButtonTheme, Record<ButtonVariant, string>> = {
  primary: {
    solid: 'bg-primary text-primary-contrast border border-transparent hover:bg-primary-hover',
    subtle: 'bg-primary-subtle text-primary-subtle-text border border-transparent hover:bg-primary-subtle-hover',
    outline: 'bg-transparent text-primary-subtle-text border border-primary-border hover:bg-hover',
    ghost: 'bg-transparent text-primary-subtle-text border border-transparent hover:bg-hover',
  },
  default: {
    solid: 'bg-gray-900 text-white border border-transparent hover:bg-gray-800',
    subtle: 'bg-gray-100 text-ink border border-transparent hover:bg-gray-200',
    outline: 'bg-transparent text-ink border border-stroke hover:bg-hover',
    ghost: 'bg-transparent text-ink border border-transparent hover:bg-hover',
  },
  danger: {
    solid: 'bg-danger text-white border border-transparent hover:bg-danger-strong',
    subtle: 'bg-danger-surface text-danger-strong border border-transparent hover:bg-danger-subtle-hover',
    outline: 'bg-transparent text-danger-strong border border-danger-border hover:bg-hover',
    ghost: 'bg-transparent text-danger-strong border border-transparent hover:bg-hover',
  },
}

/** Primary action control. Imperative-verb labels, sentence case. */
export function Button({
  children,
  theme = 'primary',
  variant = 'solid',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  fullWidth = false,
  disabled = false,
  className,
  type = 'button',
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap font-medium leading-none tracking-normal outline-none transition-[background,color,box-shadow] duration-120 ease-ks box-border',
        SIZE[size],
        PALETTE[theme][variant],
        fullWidth && 'w-full',
        isDisabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      style={style}
      {...rest}
    >
      {loading && <Spinner size={ICON_SIZE[size]} color="currentColor" thickness={2.5} />}
      {!loading && iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  )
}
