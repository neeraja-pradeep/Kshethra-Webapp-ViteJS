import { Button, Icon } from '@/shared/ui'

import { OtpCodeInput } from './OtpCodeInput'

export interface OtpVerifyFormProps {
  code: string
  onCodeChange: (value: string) => void
  hasError: boolean
  loading: boolean
  canSubmit: boolean
  primaryLabel: string
  onSubmit: () => void
  canResend: boolean
  countdownLabel: string
  onResend: () => void
  onBackToRequest: () => void
}

/** 6-digit one-time-code entry, shared by OTP login, step-up, and reset flows. */
export function OtpVerifyForm({
  code,
  onCodeChange,
  hasError,
  loading,
  canSubmit,
  primaryLabel,
  onSubmit,
  canResend,
  countdownLabel,
  onResend,
  onBackToRequest,
}: OtpVerifyFormProps) {
  return (
    <div className="flex flex-col gap-4.5">
      <OtpCodeInput value={code} onChange={onCodeChange} hasError={hasError} disabled={loading} />

      {hasError && (
        <div className="-mt-1 flex items-center justify-center gap-1.75 text-sm font-medium text-danger">
          <Icon name="warning-circle" weight="fill" size={16} />
          That code is invalid or expired.
        </div>
      )}

      <Button theme="primary" size="lg" fullWidth loading={loading} disabled={!canSubmit} onClick={onSubmit}>
        {primaryLabel}
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-sm text-ink-subtle">
        <span>Didn&rsquo;t get the code?</span>
        {canResend ? (
          <button type="button" onClick={onResend} className="cursor-pointer border-none bg-transparent p-0 text-sm font-semibold text-primary">
            Resend code
          </button>
        ) : (
          <span className="tabular-nums text-ink-muted">Resend in {countdownLabel}</span>
        )}
      </div>

      <button
        type="button"
        onClick={onBackToRequest}
        className="inline-flex cursor-pointer items-center gap-1.5 self-center border-none bg-transparent p-1 text-sm font-medium text-ink-muted"
      >
        <Icon name="arrow-left" size={15} />
        Use a different email or phone
      </button>
    </div>
  )
}
