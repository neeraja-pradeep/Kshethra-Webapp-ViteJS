import type { PasswordRequirement } from '@/features/auth/domain/entities/password-requirement'
import { Button, Icon, Input } from '@/shared/ui'

import { PasswordRequirementList } from './PasswordRequirementList'
import { PasswordVisibilityToggle } from './PasswordVisibilityToggle'

export interface SetPasswordFormProps {
  newPassword: string
  onNewPasswordChange: (value: string) => void
  showNewPassword: boolean
  onToggleShowNewPassword: () => void
  confirmPassword: string
  onConfirmPasswordChange: (value: string) => void
  showConfirmPassword: boolean
  onToggleShowConfirmPassword: () => void
  confirmError: string
  requirements: PasswordRequirement[]
  loading: boolean
  primaryLabel: string
  canSubmit: boolean
  onSubmit: () => void
}

/** Set-a-new-password screen — used both for first activation and reset. */
export function SetPasswordForm({
  newPassword,
  onNewPasswordChange,
  showNewPassword,
  onToggleShowNewPassword,
  confirmPassword,
  onConfirmPasswordChange,
  showConfirmPassword,
  onToggleShowConfirmPassword,
  confirmError,
  requirements,
  loading,
  primaryLabel,
  canSubmit,
  onSubmit,
}: SetPasswordFormProps) {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <Input
        label="New password"
        type={showNewPassword ? 'text' : 'password'}
        prefix={<Icon name="lock-simple" size={17} />}
        suffix={<PasswordVisibilityToggle shown={showNewPassword} onToggle={onToggleShowNewPassword} />}
        value={newPassword}
        onChange={(e) => onNewPasswordChange(e.target.value)}
        placeholder="Create a password"
        size="lg"
      />
      <Input
        label="Confirm password"
        type={showConfirmPassword ? 'text' : 'password'}
        prefix={<Icon name="lock-simple" size={17} />}
        suffix={<PasswordVisibilityToggle shown={showConfirmPassword} onToggle={onToggleShowConfirmPassword} />}
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        placeholder="Re-enter your password"
        error={confirmError}
        size="lg"
      />

      <PasswordRequirementList requirements={requirements} />

      <Button type="submit" theme="primary" size="lg" fullWidth loading={loading} disabled={!canSubmit}>
        {primaryLabel}
      </Button>
    </form>
  )
}
