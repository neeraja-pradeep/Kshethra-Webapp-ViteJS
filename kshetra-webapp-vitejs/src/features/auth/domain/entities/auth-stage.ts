/** The four screens the standalone auth surface can render. */
export type AuthStage = 'login' | 'request-code' | 'otp' | 'set-password'

/** Why the user landed on the "request a code" screen. */
export type RequestCodeContext = 'signin' | 'reset' | 'first'

/** Why the user landed on the OTP-verification screen. */
export type OtpContext = 'login' | 'verify' | 'reset'

/** Why the user landed on the "set a password" screen. */
export type SetPasswordContext = 'create' | 'reset'

/** End-to-end journey a set of screens belongs to (drives copy + routing). */
export type AuthFlow = 'password' | 'otp' | 'reset' | 'first' | 'stepup'

/** Local request lifecycle for the screen currently in view. */
export type AuthStatus = 'idle' | 'loading' | 'error' | 'success'
