/**
 * The single error type the app deals in. Infrastructure converts every thrown
 * axios/zod error into one of these; nothing above that layer ever sees a raw
 * HTTP error. Every `message` is safe to render to a user as-is.
 */

/** Field name -> messages, as returned by DRF serializer validation. */
export type FieldErrors = Readonly<Record<string, readonly string[]>>

interface FailureBase {
  /** User-safe, already-humanised. Never a stack trace or an axios internal. */
  readonly message: string
  /** HTTP status, when the failure came from a response. */
  readonly status?: number
  /**
   * Any non-message keys the server sent alongside a business-rule error —
   * e.g. `{ receipt_no: "RCP-1002" }` on an already-collected booking.
   */
  readonly details?: Readonly<Record<string, unknown>>
}

/** The request never reached the server (offline, DNS, timeout, CORS). */
export interface NetworkFailure extends FailureBase {
  readonly kind: 'network'
}

/**
 * The request was sent but no reply arrived in time. Crucially different from
 * `network`: the server may well have processed it, so a write must NOT be
 * blindly retried.
 */
export interface TimeoutFailure extends FailureBase {
  readonly kind: 'timeout'
}

/** `400` — the request was understood and refused. Nothing was written. */
export interface ValidationFailure extends FailureBase {
  readonly kind: 'validation'
  /** Empty for a flat business-rule error, populated for field-keyed DRF errors. */
  readonly fieldErrors: FieldErrors
}

/** `401` — not signed in, or the session expired. */
export interface UnauthorizedFailure extends FailureBase {
  readonly kind: 'unauthorized'
}

/** `403` — signed in, but the RBAC permission is missing. */
export interface ForbiddenFailure extends FailureBase {
  readonly kind: 'forbidden'
}

/** `404` — unknown id, or someone else's object (the server never distinguishes). */
export interface NotFoundFailure extends FailureBase {
  readonly kind: 'notFound'
}

/** `5xx`, or a response whose shape did not match its schema. */
export interface ServerFailure extends FailureBase {
  readonly kind: 'server'
}

export interface UnknownFailure extends FailureBase {
  readonly kind: 'unknown'
}

export type Failure =
  | NetworkFailure
  | TimeoutFailure
  | ValidationFailure
  | UnauthorizedFailure
  | ForbiddenFailure
  | NotFoundFailure
  | ServerFailure
  | UnknownFailure

export type FailureKind = Failure['kind']
