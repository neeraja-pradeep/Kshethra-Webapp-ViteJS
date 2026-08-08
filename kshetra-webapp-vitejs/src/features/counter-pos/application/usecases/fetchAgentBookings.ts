import type { Result } from '@/core/error/result'
import type { AgentBooking } from '@/features/counter-pos/domain/entities/agent-booking'
import type { AgentBookingFilters } from '@/features/counter-pos/domain/repositories/counter.repository'
import { counterRepository } from '@/features/counter-pos/infrastructure/repositories/counter.repository.impl'

export function fetchAgentBookings(filters: AgentBookingFilters): Promise<Result<readonly AgentBooking[]>> {
  return counterRepository.fetchAgentBookings(filters)
}
