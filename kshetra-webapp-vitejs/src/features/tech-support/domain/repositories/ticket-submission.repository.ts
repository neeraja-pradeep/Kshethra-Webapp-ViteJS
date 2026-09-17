import type { TicketSubmission, TicketSubmissionResult } from '@/features/tech-support/domain/entities/ticket-submission'
import type { WebhookFailure } from '@/features/tech-support/domain/entities/webhook-failure'

/**
 * Mirrors `core/error/result.ts`'s `Result<T>` shape, but over `WebhookFailure`
 * rather than the shared `Failure` — this submission talks to a different
 * service with its own error dialect (see `webhook-failure.ts`), so the two
 * result types are deliberately not unified.
 */
export type WebhookResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: WebhookFailure }

export interface TicketSubmissionRepository {
  submitTicket(input: TicketSubmission): Promise<WebhookResult<TicketSubmissionResult>>
}
