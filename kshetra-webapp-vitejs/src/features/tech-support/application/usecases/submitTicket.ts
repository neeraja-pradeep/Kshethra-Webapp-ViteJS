import type { TicketSubmission, TicketSubmissionResult } from '@/features/tech-support/domain/entities/ticket-submission'
import type { WebhookResult } from '@/features/tech-support/domain/repositories/ticket-submission.repository'
import { ticketSubmissionRepository } from '@/features/tech-support/infrastructure/repositories/ticket-submission.repository.impl'

export function submitTicket(input: TicketSubmission): Promise<WebhookResult<TicketSubmissionResult>> {
  return ticketSubmissionRepository.submitTicket(input)
}
