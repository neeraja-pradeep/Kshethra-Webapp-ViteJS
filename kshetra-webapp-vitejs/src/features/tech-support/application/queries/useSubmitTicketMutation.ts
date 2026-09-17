import { useMutation } from '@tanstack/react-query'

import type { TicketSubmission, TicketSubmissionResult } from '@/features/tech-support/domain/entities/ticket-submission'
import type { WebhookFailure } from '@/features/tech-support/domain/entities/webhook-failure'
import { submitTicket } from '@/features/tech-support/application/usecases/submitTicket'

/**
 * Mirrors `core/error/result.ts`'s `FailureError` / `unwrap`, but for
 * `WebhookFailure` — see `ticket-submission.repository.ts` for why the two
 * result types are kept separate.
 */
export class WebhookFailureError extends Error {
  readonly failure: WebhookFailure

  constructor(failure: WebhookFailure) {
    super(failure.message)
    this.name = 'WebhookFailureError'
    this.failure = failure
  }
}

/** Reads the `WebhookFailure` back off whatever TanStack Query handed the screen as `error`. */
export function toWebhookFailure(error: unknown): WebhookFailure | null {
  return error instanceof WebhookFailureError ? error.failure : null
}

export function useSubmitTicketMutation() {
  return useMutation<TicketSubmissionResult, WebhookFailureError, TicketSubmission>({
    mutationFn: async (input) => {
      const result = await submitTicket(input)
      if (!result.ok) throw new WebhookFailureError(result.error)
      return result.value
    },
  })
}
