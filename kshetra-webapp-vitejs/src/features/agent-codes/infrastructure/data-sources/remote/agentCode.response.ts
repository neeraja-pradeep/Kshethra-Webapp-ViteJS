import { z } from 'zod'

import { paginated } from '@/core/api/wire'

import type {
  AgentCode,
  AgentCodeDetail,
  AgentCodeSummary,
  AgentCodeUsage,
  AgentCodeUsageBooking,
} from '@/features/agent-codes/domain/entities/agent-code'

/**
 * Wire shapes for `admin/agent-codes/`.
 *
 * Money arrives as JSON **numbers** (`1000.0`), not the decimal strings most of
 * this API uses — so `z.number()` here rather than the shared `decimal`.
 */

export const agentCodeStatusSchema = z.enum(['active', 'inactive'])
/**
 * `expired` is a legacy status still on old rows. It is never written and never
 * accepted as input, but it has to parse or those rows fail the whole page.
 */
const storedStatusSchema = z.union([agentCodeStatusSchema, z.literal('expired')])
export const agentCodeValiditySchema = z.enum(['active', 'scheduled', 'expired'])

/** One row of the table — also what the status toggle answers with. */
export const agentCodeRowSchema = z.object({
  id: z.number(),
  code: z.string(),
  description: z.string(),
  valid_from: z.string().nullable(),
  valid_to: z.string().nullable(),
  validity_state: agentCodeValiditySchema,
  uses: z.number(),
  usage_limit: z.number().nullable(),
  order_value: z.number(),
  status: storedStatusSchema,
})

const usageBookingSchema = z.object({
  order_id: z.number(),
  order_ref: z.string(),
  devotee: z.string(),
  pooja_summary: z.string(),
  pooja_count: z.number(),
  date: z.string().nullable(),
  amount: z.number(),
  paid: z.boolean(),
  status: z.string(),
})

const usageSchema = z.object({
  times_used: z.number(),
  total_order_value: z.number(),
  bookings: z.array(usageBookingSchema),
  has_more: z.boolean(),
})

/** `GET`/`POST`/`PATCH` on one code — the row plus what the detail page draws. */
export const agentCodeDetailSchema = agentCodeRowSchema.extend({
  created_at: z.string(),
  usage: usageSchema,
  deletable: z.boolean(),
  active_carts: z.number(),
})

const summarySchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
})

/** The list: a DRF page with `summary` sitting **beside** `results`. */
export const agentCodePageSchema = paginated(agentCodeRowSchema).extend({
  summary: summarySchema,
})

export type AgentCodeRowDto = z.infer<typeof agentCodeRowSchema>
export type AgentCodeDetailDto = z.infer<typeof agentCodeDetailSchema>
export type AgentCodePageDto = z.infer<typeof agentCodePageSchema>

/** A legacy `expired` row is shown as inactive — it cannot be redeemed. */
function toStatus(stored: z.infer<typeof storedStatusSchema>) {
  return stored === 'expired' ? 'inactive' : stored
}

export function toAgentCode(dto: AgentCodeRowDto): AgentCode {
  return {
    id: dto.id,
    code: dto.code,
    description: dto.description,
    validFrom: dto.valid_from,
    validTo: dto.valid_to,
    validityState: dto.validity_state,
    uses: dto.uses,
    usageLimit: dto.usage_limit,
    orderValue: dto.order_value,
    status: toStatus(dto.status),
  }
}

function toUsageBooking(dto: z.infer<typeof usageBookingSchema>): AgentCodeUsageBooking {
  return {
    orderId: dto.order_id,
    orderRef: dto.order_ref,
    devotee: dto.devotee,
    poojaSummary: dto.pooja_summary,
    poojaCount: dto.pooja_count,
    date: dto.date,
    amount: dto.amount,
    paid: dto.paid,
    status: dto.status,
  }
}

function toUsage(dto: z.infer<typeof usageSchema>): AgentCodeUsage {
  return {
    timesUsed: dto.times_used,
    totalOrderValue: dto.total_order_value,
    bookings: dto.bookings.map(toUsageBooking),
    hasMore: dto.has_more,
  }
}

export function toAgentCodeDetail(dto: AgentCodeDetailDto): AgentCodeDetail {
  return {
    ...toAgentCode(dto),
    createdAt: dto.created_at,
    usage: toUsage(dto.usage),
    deletable: dto.deletable,
    activeCarts: dto.active_carts,
  }
}

export function toAgentCodeSummary(dto: z.infer<typeof summarySchema>): AgentCodeSummary {
  return { total: dto.total, active: dto.active, inactive: dto.inactive }
}
