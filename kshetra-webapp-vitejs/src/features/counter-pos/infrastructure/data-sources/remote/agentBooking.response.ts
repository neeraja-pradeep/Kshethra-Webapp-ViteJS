import { z } from 'zod'

import type { AgentBooking } from '@/features/counter-pos/domain/entities/agent-booking'
import { decimal } from '@/features/counter-pos/infrastructure/data-sources/remote/wire'

export const agentBookingResponseSchema = z.object({
  order_id: z.number(),
  order_ref: z.string(),
  devotee: z.string(),
  phone: z.string().nullable(),
  agent_code: z.string().nullable(),
  pooja_summary: z.string(),
  pooja_count: z.number(),
  first_pooja_date: z.string().nullable(),
  amount: decimal,
  paid: z.boolean(),
  payment_method: z.enum(['cash', 'card', 'upi', 'netbanking']).nullable(),
  receipt_no: z.string().nullable(),
})

export type AgentBookingResponseDto = z.infer<typeof agentBookingResponseSchema>

export function toAgentBooking(dto: AgentBookingResponseDto): AgentBooking {
  return {
    orderId: dto.order_id,
    orderRef: dto.order_ref,
    devotee: dto.devotee,
    phone: dto.phone ?? '',
    code: dto.agent_code ?? '',
    poojaSummary: dto.pooja_summary,
    poojaCount: dto.pooja_count,
    firstPoojaDate: dto.first_pooja_date,
    amount: dto.amount,
    method: dto.payment_method,
    receiptNo: dto.receipt_no,
    paid: dto.paid,
  }
}
