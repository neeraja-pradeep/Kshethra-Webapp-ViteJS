import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export type IconButtonTheme = 'primary' | 'default' | 'danger'
export type IconButtonVariant = 'ghost' | 'subtle' | 'outline' | 'solid'
export type IconButtonSize = 'sm' | 'md' | 'lg'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  children?: ReactNode
  theme?: IconButtonTheme
  variant?: IconButtonVariant
  size?: IconButtonSize
  /** Accessible label (also the title tooltip). */
  label?: string
  style?: CSSProperties
}

const SIZE: Record<IconButtonSize, string> = {
  sm: 'w-7 h-7 rounded-md',
  md: 'w-8 h-8 rounded-md',
  lg: 'w-10 h-10 rounded-lg',
}

const PALETTE: Record<IconButtonTheme, Record<IconButtonVariant, string>> = {
  primary: {
    solid: 'bg-primary text-primary-contrast border border-transparent hover:bg-primary-hover',
    subtle: 'bg-primary-subtle text-primary-subtle-text border border-transparent hover:bg-primary-subtle-hover',
    outline: 'bg-transparent text-primary-subtle-text border border-primary-border hover:bg-hover',
    ghost: 'bg-transparent text-primary-subtle-text border border-transparent hover:bg-hover',
  },
  default: {
    solid: 'bg-gray-900 text-white border border-transparent hover:bg-gray-800',
    subtle: 'bg-gray-100 text-ink-muted border border-transparent hover:bg-gray-200',
    outline: 'bg-transparent text-ink-muted border border-stroke hover:bg-hover',
    ghost: 'bg-transparent text-ink-muted border border-transparent hover:bg-hover',
  },
  danger: {
    solid: 'bg-danger text-white border border-transparent hover:bg-danger-strong',
    subtle: 'bg-danger-surface text-danger-strong border border-transparent hover:bg-danger-subtle-hover',
    outline: 'bg-transparent text-danger-strong border border-danger-border hover:bg-hover',
    ghost: 'bg-transparent text-danger-strong border border-transparent hover:bg-hover',
  },
}

/** Square, icon-only button. Pass the icon as children. */
export function IconButton({
  children,
  theme = 'default',
  variant = 'ghost',
  size = 'md',
  label,
  disabled = false,
  className,
  type = 'button',
  style,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center box-border p-0 outline-none transition-[background,color] duration-120 ease-ks',
        SIZE[size],
        PALETTE[theme][variant],
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
      style={style}
      {...rest}
    >
      {children}
    </button>
  )
}
