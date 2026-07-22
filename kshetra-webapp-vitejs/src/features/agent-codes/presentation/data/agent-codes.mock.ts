import type { AgentCode } from '@/features/agent-codes/domain/entities/agent-code'

/** Static fixture — copied verbatim from the DC prototype's buildCodes() seed. */
export const AGENT_CODES: AgentCode[] = [
  { id: 'AC-1', code: 'TEMPLE50', description: 'Temple-desk assisted booking', from: '2026-06-01T00:00', to: '2026-12-31T23:59', limit: 0, status: 'Active' },
  { id: 'AC-2', code: 'SEVA', description: 'Seva counter — pay on visit', from: '2026-01-01T00:00', to: '2026-12-31T23:59', limit: 0, status: 'Active' },
  { id: 'AC-3', code: 'FESTIVE', description: 'Festival desk bookings', from: '2026-06-15T00:00', to: '2026-08-31T23:59', limit: 500, status: 'Active' },
  { id: 'AC-4', code: 'GURUKRIPA', description: 'Guru Purnima counter payment', from: '2026-07-01T00:00', to: '2026-07-20T23:59', limit: 300, status: 'Active' },
  { id: 'AC-5', code: 'ANNADANAM', description: 'Annadanam desk', from: '2026-06-01T00:00', to: '2026-12-31T23:59', limit: 0, status: 'Active' },
  { id: 'AC-6', code: 'MANDALA', description: 'Ayyappa mandala season desk', from: '2025-11-15T00:00', to: '2026-01-15T23:59', limit: 0, status: 'Inactive' },
]
