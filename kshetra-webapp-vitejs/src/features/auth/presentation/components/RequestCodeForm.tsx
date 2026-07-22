import { Button, Icon, Input } from '@/shared/ui'

export interface RequestCodeFormProps {
  identifier: string
  onIdentifierChange: (value: string) => void
  identifierError: string
  loading: boolean
  canSubmit: boolean
  primaryLabel: string
  onSubmit: () => void
  onBackToLogin: () => void
}

/** Request-a-code screen — used for OTP sign-in, password reset, and first login. */
export function RequestCodeForm({
  identifier,
  onIdentifierChange,
  identifierError,
  loading,
  canSubmit,
  primaryLabel,
  onSubmit,
  onBackToLogin,
}: RequestCodeFormProps) {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <Input
        label="Email or phone"
        prefix={<Icon name="user" size={17} />}
        value={identifier}
        onChange={(e) => onIdentifierChange(e.target.value)}
        placeholder="you@temple.org or +91 98450 00000"
        error={identifierError}
        size="lg"
      />

      <Button type="submit" theme="primary" size="lg" fullWidth loading={loading} disabled={!canSubmit}>
        {primaryLabel}
      </Button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="inline-flex cursor-pointer items-center gap-1.5 self-center border-none bg-transparent p-1 text-sm font-medium text-ink-muted"
      >
        <Icon name="arrow-left" size={15} />
        Back to password login
      </button>
    </form>
  )
}
