import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type {
  AuthFlow,
  AuthStage,
  AuthStatus,
  OtpContext,
  RequestCodeContext,
  SetPasswordContext,
} from '@/features/auth/domain/entities/auth-stage'
import type { PasswordRequirement } from '@/features/auth/domain/entities/password-requirement'
import { AuthBrandPanel } from '@/features/auth/presentation/components/AuthBrandPanel'
import { AuthCompactBrand } from '@/features/auth/presentation/components/AuthCompactBrand'
import { AuthFooter } from '@/features/auth/presentation/components/AuthFooter'
import { AuthSuccessPanel } from '@/features/auth/presentation/components/AuthSuccessPanel'
import { LoginForm } from '@/features/auth/presentation/components/LoginForm'
import { OtpVerifyForm } from '@/features/auth/presentation/components/OtpVerifyForm'
import { RequestCodeForm } from '@/features/auth/presentation/components/RequestCodeForm'
import { SetPasswordForm } from '@/features/auth/presentation/components/SetPasswordForm'

/** Fake credential that deliberately fails, so the error state is reachable without a backend. */
const MOCK_WRONG_PASSWORD = 'wrong'
const MOCK_WRONG_IDENTIFIER = 'wrong'
const MOCK_WRONG_OTP = '000000'
const OTP_RESEND_SECONDS = 30

/** Masks an email/phone the way the server would when confirming where a code went. */
function maskTarget(identifier: string): string {
  const id = identifier.trim()
  if (!id) return '+91 ••• ••1234'
  if (id.includes('@')) {
    const [name, domain] = id.split('@')
    return `${name.slice(0, 1)}•••@${domain}`
  }
  const digits = id.replace(/\D/g, '')
  if (digits.length >= 4) return `+91 ••• •••${digits.slice(-4)}`
  return id
}

/**
 * Standalone Kshetra Admin sign-in surface — a full-viewport two-panel layout
 * (brand panel + form card) covering password login, OTP verification,
 * password-reset request, and set-new-password, each with mock loading /
 * error / success behaviour. Not part of the AdminLayout shell.
 */
export function AuthScreen() {
  const navigate = useNavigate()

  const [stage, setStage] = useState<AuthStage>('login')
  const [requestContext, setRequestContext] = useState<RequestCodeContext>('signin')
  const [otpContext, setOtpContext] = useState<OtpContext>('login')
  const [setPasswordContext, setSetPasswordContext] = useState<SetPasswordContext>('create')
  const [flow, setFlow] = useState<AuthFlow>('password')
  const [status, setStatus] = useState<AuthStatus>('idle')

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [remember, setRemember] = useState(true)

  const [otpCountdown, setOtpCountdown] = useState(OTP_RESEND_SECONDS)

  const primaryTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const redirectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      clearTimeout(primaryTimeout.current)
      clearTimeout(redirectTimeout.current)
    }
  }, [])

  // Every successful action eventually lands the operator in the console.
  useEffect(() => {
    if (status !== 'success') return
    redirectTimeout.current = setTimeout(() => navigate('/dashboard'), 900)
    return () => clearTimeout(redirectTimeout.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Countdown for "resend code", restarted whenever the OTP screen is (re-)entered.
  useEffect(() => {
    if (stage !== 'otp') return
    setOtpCountdown(OTP_RESEND_SECONDS)
    const id = setInterval(() => {
      setOtpCountdown((n) => (n <= 1 ? 0 : n - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [stage, otpContext, flow])

  function clearStatusTimers() {
    clearTimeout(primaryTimeout.current)
    clearTimeout(redirectTimeout.current)
  }

  function goToLogin() {
    clearStatusTimers()
    setStage('login')
    setFlow('password')
    setStatus('idle')
    setPassword('')
  }

  function goToRequestCode(context: RequestCodeContext, nextFlow: AuthFlow) {
    clearStatusTimers()
    setStage('request-code')
    setRequestContext(context)
    setFlow(nextFlow)
    setStatus('idle')
  }

  function goToOtp(context: OtpContext, nextFlow: AuthFlow) {
    clearStatusTimers()
    setStage('otp')
    setOtpContext(context)
    setFlow(nextFlow)
    setStatus('idle')
    setOtpCode('')
  }

  function goToSetPassword(context: SetPasswordContext, nextFlow: AuthFlow) {
    clearStatusTimers()
    setStage('set-password')
    setSetPasswordContext(context)
    setFlow(nextFlow)
    setStatus('idle')
    setNewPassword('')
    setConfirmPassword('')
  }

  function clearErrorOnEdit() {
    setStatus((s) => (s === 'error' ? 'idle' : s))
  }

  // ---- password rules (live, not gated on submit) ----
  const passwordRequirements: PasswordRequirement[] = [
    { id: 'length', label: 'At least 8 characters', met: newPassword.length >= 8 },
    { id: 'upper', label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
    { id: 'digit', label: 'One number', met: /[0-9]/.test(newPassword) },
  ]
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword
  const confirmError = passwordsMismatch ? 'Passwords don’t match.' : ''

  // ---- submit gating ----
  const canSubmitLogin = identifier.trim().length > 0 && password.length > 0
  const canSubmitRequest = identifier.trim().length > 0
  const canSubmitOtp = otpCode.length === 6
  const canSubmitSetPassword =
    passwordRequirements.every((r) => r.met) && confirmPassword.length > 0 && confirmPassword === newPassword

  function handlePrimary() {
    setStatus('loading')
    clearTimeout(primaryTimeout.current)

    if (stage === 'login') {
      primaryTimeout.current = setTimeout(() => {
        if (password.trim().toLowerCase() === MOCK_WRONG_PASSWORD) setStatus('error')
        else setStatus('success')
      }, 1150)
      return
    }

    if (stage === 'request-code') {
      primaryTimeout.current = setTimeout(() => {
        if (identifier.trim().toLowerCase() === MOCK_WRONG_IDENTIFIER) {
          setStatus('error')
          return
        }
        if (requestContext === 'reset') goToOtp('reset', 'reset')
        else if (requestContext === 'first') goToOtp('login', 'first')
        else goToOtp('login', 'otp')
      }, 950)
      return
    }

    if (stage === 'otp') {
      primaryTimeout.current = setTimeout(() => {
        if (otpCode === MOCK_WRONG_OTP) {
          setStatus('error')
          return
        }
        if (flow === 'reset') goToSetPassword('reset', 'reset')
        else if (flow === 'first') goToSetPassword('create', 'first')
        else setStatus('success')
      }, 1150)
      return
    }

    if (stage === 'set-password') {
      primaryTimeout.current = setTimeout(() => setStatus('success'), 1150)
    }
  }

  // ---- titles / subtitles ----
  const masked = maskTarget(identifier)
  let screenTitle = ''
  let screenSubtitle = ''
  if (stage === 'login') {
    screenTitle = 'Sign in'
    screenSubtitle = 'Access the Kshetra Admin console.'
  } else if (stage === 'request-code') {
    if (requestContext === 'reset') {
      screenTitle = 'Reset your password'
      screenSubtitle = 'Enter your account email or phone and we’ll send a reset code.'
    } else if (requestContext === 'first') {
      screenTitle = 'Activate your account'
      screenSubtitle = 'Enter the email or phone your account was created with to get started.'
    } else {
      screenTitle = 'Log in with a code'
      screenSubtitle = 'We’ll send a one-time code to your email or phone — no password needed.'
    }
  } else if (stage === 'otp') {
    if (otpContext === 'verify') {
      screenTitle = 'Verify it’s you'
      screenSubtitle = `For your security, enter the 6-digit code we just sent to ${masked}.`
    } else if (otpContext === 'reset') {
      screenTitle = 'Enter the code'
      screenSubtitle = `We sent a 6-digit code to ${masked} to reset your password.`
    } else {
      screenTitle = 'Enter the code'
      screenSubtitle = `We sent a 6-digit code to ${masked}.`
    }
  } else if (stage === 'set-password') {
    if (setPasswordContext === 'reset') {
      screenTitle = 'Set a new password'
      screenSubtitle = 'Choose a new password for your account.'
    } else {
      screenTitle = 'Create your password'
      screenSubtitle = 'Set a password to finish activating your account.'
    }
  }

  // ---- success copy ----
  let successTitle = 'Done'
  let successSubtitle = ''
  let successHint = 'Redirecting…'
  if (stage === 'login') {
    successTitle = 'You’re signed in'
    successSubtitle = 'Welcome back to Kshetra Admin.'
    successHint = 'Taking you to the console…'
  } else if (stage === 'otp') {
    if (otpContext === 'verify') {
      successTitle = 'Identity confirmed'
      successSubtitle = 'Thanks for confirming it’s you.'
      successHint = 'Continuing…'
    } else {
      successTitle = 'You’re signed in'
      successSubtitle = 'Your code was verified.'
      successHint = 'Taking you to the console…'
    }
  } else if (stage === 'set-password') {
    successTitle = 'Password saved'
    successSubtitle = setPasswordContext === 'reset' ? 'Your password has been updated.' : 'Your account is ready.'
    successHint = 'Taking you to the console…'
  }

  // ---- primary label ----
  const loadingWord: Record<AuthStage, string> = {
    login: 'Signing in…',
    'request-code': 'Sending code…',
    otp: 'Verifying…',
    'set-password': 'Saving…',
  }
  let actionWord = 'Continue'
  if (stage === 'login') actionWord = 'Log in'
  else if (stage === 'request-code') actionWord = 'Send code'
  else if (stage === 'otp') actionWord = 'Verify'
  else if (stage === 'set-password') actionWord = setPasswordContext === 'reset' ? 'Save new password' : 'Create password'
  const primaryLabel = status === 'loading' ? loadingWord[stage] : actionWord

  const isOtpError = status === 'error' && stage === 'otp'
  const countdownLabel = `0:${String(otpCountdown).padStart(2, '0')}`

  const isSuccess = status === 'success'
  const isLoading = status === 'loading'

  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-y-auto bg-sunken p-6 font-sans text-ink">
      <div className="flex w-full max-w-[1040px] overflow-hidden rounded-[24px] bg-card shadow-xl lg:min-h-[588px]">
        <AuthBrandPanel />

        <div className="flex min-w-0 flex-1 flex-col p-[clamp(26px,4vw,48px)]">
          <AuthCompactBrand />

          <div className="flex flex-1 flex-col justify-center">
            <div className="mx-auto w-full max-w-[392px]">
              {isSuccess ? (
                <AuthSuccessPanel title={successTitle} subtitle={successSubtitle} hint={successHint} />
              ) : (
                <div>
                  <div className="mb-6">
                    <h1 className="m-0 text-3xl font-heading tracking-title text-ink-strong">{screenTitle}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{screenSubtitle}</p>
                  </div>

                  {stage === 'login' && (
                    <LoginForm
                      identifier={identifier}
                      onIdentifierChange={(v) => {
                        setIdentifier(v)
                        clearErrorOnEdit()
                      }}
                      password={password}
                      onPasswordChange={(v) => {
                        setPassword(v)
                        clearErrorOnEdit()
                      }}
                      passwordError={status === 'error' ? 'Incorrect email or password.' : ''}
                      showPassword={showPassword}
                      onToggleShowPassword={() => setShowPassword((v) => !v)}
                      remember={remember}
                      onRememberChange={setRemember}
                      onForgotPassword={() => goToRequestCode('reset', 'reset')}
                      onOtpInstead={() => goToRequestCode('signin', 'otp')}
                      loading={isLoading}
                      canSubmit={canSubmitLogin}
                      primaryLabel={primaryLabel}
                      onSubmit={handlePrimary}
                    />
                  )}

                  {stage === 'request-code' && (
                    <RequestCodeForm
                      identifier={identifier}
                      onIdentifierChange={(v) => {
                        setIdentifier(v)
                        clearErrorOnEdit()
                      }}
                      identifierError={status === 'error' ? 'No account found for that email or phone.' : ''}
                      loading={isLoading}
                      canSubmit={canSubmitRequest}
                      primaryLabel={primaryLabel}
                      onSubmit={handlePrimary}
                      onBackToLogin={goToLogin}
                    />
                  )}

                  {stage === 'otp' && (
                    <OtpVerifyForm
                      code={otpCode}
                      onCodeChange={(v) => {
                        setOtpCode(v)
                        clearErrorOnEdit()
                      }}
                      hasError={isOtpError}
                      loading={isLoading}
                      canSubmit={canSubmitOtp}
                      primaryLabel={primaryLabel}
                      onSubmit={handlePrimary}
                      canResend={otpCountdown <= 0}
                      countdownLabel={countdownLabel}
                      onResend={() => {
                        setOtpCode('')
                        setStatus('idle')
                        setOtpCountdown(OTP_RESEND_SECONDS)
                      }}
                      onBackToRequest={() =>
                        goToRequestCode(flow === 'reset' ? 'reset' : flow === 'first' ? 'first' : 'signin', flow)
                      }
                    />
                  )}

                  {stage === 'set-password' && (
                    <SetPasswordForm
                      newPassword={newPassword}
                      onNewPasswordChange={setNewPassword}
                      showNewPassword={showNewPassword}
                      onToggleShowNewPassword={() => setShowNewPassword((v) => !v)}
                      confirmPassword={confirmPassword}
                      onConfirmPasswordChange={setConfirmPassword}
                      showConfirmPassword={showConfirmPassword}
                      onToggleShowConfirmPassword={() => setShowConfirmPassword((v) => !v)}
                      confirmError={confirmError}
                      requirements={passwordRequirements}
                      loading={isLoading}
                      canSubmit={canSubmitSetPassword}
                      primaryLabel={primaryLabel}
                      onSubmit={handlePrimary}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <AuthFooter />
        </div>
      </div>
    </div>
  )
}
