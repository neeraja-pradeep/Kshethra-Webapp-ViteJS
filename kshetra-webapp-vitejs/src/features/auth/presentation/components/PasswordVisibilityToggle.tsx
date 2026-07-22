import { Icon } from '@/shared/ui'

export interface PasswordVisibilityToggleProps {
  shown: boolean
  onToggle: () => void
}

/** Eye / eye-slash button used as an Input suffix to reveal a password field. */
export function PasswordVisibilityToggle({ shown, onToggle }: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      className="inline-flex cursor-pointer items-center justify-center border-none bg-transparent p-0.5 text-ink-subtle"
    >
      <Icon name={shown ? 'eye-slash' : 'eye'} size={18} />
    </button>
  )
}
