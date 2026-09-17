import { ZodError } from 'zod'

import type { TicketSubmission, TicketSubmissionResult } from '@/features/tech-support/domain/entities/ticket-submission'
import type {
  TicketSubmissionRepository,
  WebhookResult,
} from '@/features/tech-support/domain/repositories/ticket-submission.repository'
import { postToClozrWebhook } from '@/features/tech-support/infrastructure/data-sources/remote/clozrWebhookClient'
import { mapClozrError } from '@/features/tech-support/infrastructure/data-sources/remote/mapClozrError'
import {
  ticketSubmissionResponseSchema,
  toTicketSubmissionResult,
  toWireBody,
} from '@/features/tech-support/infrastructure/data-sources/remote/ticketSubmission.wire'

/** One idempotency key per submission, reused across its own 429 retries — never across two separate reports. */
function newIdempotencyKey(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tk-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const ticketSubmissionRepository: TicketSubmissionRepository = {
  async submitTicket(input: TicketSubmission): Promise<WebhookResult<TicketSubmissionResult>> {
    try {
      const raw = await postToClozrWebhook(toWireBody(input), newIdempotencyKey())
      const dto = ticketSubmissionResponseSchema.parse(raw)
      return { ok: true, value: toTicketSubmissionResult(dto) }
    } catch (error) {
      if (error instanceof ZodError) {
        /*
         * A 202 whose body we cannot read. The ticket exists — the server only
         * returns 202 after creating it — so reporting failure would send the
         * reporter to file a duplicate. Succeed with an empty `issueId`; the
         * screen already treats that as "filed, reference unavailable" rather
         * than printing a bogus one.
         *
         * Deliberately narrow: this catches only a *shape* mismatch on a
         * success response. Every real failure is an axios error and falls
         * through to the mapper below.
         */
        return { ok: true, value: { issueId: '', requestId: '', attachmentsAttached: 0 } }
      }
      return { ok: false, error: mapClozrError(error) }
    }
  },
}
