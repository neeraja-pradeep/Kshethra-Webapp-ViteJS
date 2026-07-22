import { Button, Checkbox, Icon, Input } from '@/shared/ui'

import { PasswordVisibilityToggle } from './PasswordVisibilityToggle'

export interface LoginFormProps {
  identifier: string
  onIdentifierChange: (value: string) => void
  password: string
  onPasswordChange: (value: string) => void
  passwordError: string
  showPassword: boolean
  onToggleShowPassword: () => void
  remember: boolean
  onRememberChange: (value: boolean) => void
  onForgotPassword: () => void
  onOtpInstead: () => void
  loading: boolean
  canSubmit: boolean
  primaryLabel: string
  onSubmit: () => void
}

/** Password sign-in — the default screen of the auth surface. */
export function LoginForm({
  identifier,
  onIdentifierChange,
  password,
  onPasswordChange,
  passwordError,
  showPassword,
  onToggleShowPassword,
  remember,
  onRememberChange,
  onForgotPassword,
  onOtpInstead,
  loading,
  canSubmit,
  primaryLabel,
  onSubmit,
}: LoginFormProps) {
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
        size="lg"
      />
      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        prefix={<Icon name="lock-simple" size={17} />}
        suffix={<PasswordVisibilityToggle shown={showPassword} onToggle={onToggleShowPassword} />}
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        placeholder="Enter your password"
        error={passwordError}
        size="lg"
      />

      <div className="-mt-0.5 flex flex-wrap items-center justify-between gap-3">
        <Checkbox checked={remember} onChange={(e) => onRememberChange(e.target.checked)} label="Remember me" size="sm" />
        <button
          type="button"
          onClick={onForgotPassword}
          className="cursor-pointer whitespace-nowrap border-none bg-transparent p-0 text-sm font-medium text-primary"
        >
          Forgot password?
        </button>
      </div>

      <Button type="submit" theme="primary" size="lg" fullWidth loading={loading} disabled={!canSubmit}>
        {primaryLabel}
      </Button>

      <div className="my-0.5 flex items-center gap-3 text-ink-subtle">
        <div className="h-px flex-1 bg-stroke-subtle" />
        <span className="text-2xs">or</span>
        <div className="h-px flex-1 bg-stroke-subtle" />
      </div>

      <Button theme="default" variant="outline" size="lg" fullWidth onClick={onOtpInstead}>
        Log in with a one-time code
      </Button>
    </form>
  )
}
