import type { Failure, FieldErrors } from '@/core/error/failure'

/**
 * Errors are values, not surprises. Every repository method returns one of
 * these, so callers must acknowledge the failure branch to reach the data.
 */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: Failure }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err<T = never>(error: Failure): Result<T> {
  return { ok: false, error }
}

/**
 * Unwraps a result for a TanStack Query `queryFn`/`mutationFn`, which signal
 * failure by throwing. The Failure survives on the thrown error so the UI can
 * still branch on `kind`.
 */
export class FailureError extends Error {
  readonly failure: Failure

  constructor(failure: Failure) {
    super(failure.message)
    this.name = 'FailureError'
    this.failure = failure
  }
}

export function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.value
  throw new FailureError(result.error)
}

/** Reads the Failure back off whatever TanStack Query handed us as `error`. */
export function toFailure(error: unknown): Failure | null {
  return error instanceof FailureError ? error.failure : null
}

const NO_FIELD_ERRORS: FieldErrors = {}

/**
 * Per-field messages for a form, or an empty record.
 *
 * Only a validation failure carries them — a timeout or a 403 has nothing to
 * say about any particular input — so this narrows rather than making every
 * caller remember which `kind` to check.
 */
export function toFieldErrors(error: unknown): FieldErrors {
  const failure = toFailure(error)
  return failure?.kind === 'validation' ? failure.fieldErrors : NO_FIELD_ERRORS
}
