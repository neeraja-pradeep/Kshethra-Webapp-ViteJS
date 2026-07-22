import type { AgentCodeUsage } from '@/features/agent-codes/domain/entities/agent-code-usage'

/**
 * Static fixture standing in for the DC prototype's `props.bookings` (the
 * host app passes booking rows in; here they are seeded directly so a query
 * hook can replace this import later without touching the screen).
 */
export const AGENT_CODE_USAGE: AgentCodeUsage[] = [
  { orderRef: 'ORD-8831', code: 'TEMPLE50', devotee: 'Lakshmi Menon', poojaSummary: 'Ganapathi Homam · 1 devotee', date: '18 Jul 26', amount: 1500, paid: true },
  { orderRef: 'ORD-8842', code: 'TEMPLE50', devotee: 'Ravi Kumar', poojaSummary: 'Abhishekam · 2 devotees', date: '15 Jul 26', amount: 900, paid: false },
  { orderRef: 'ORD-8850', code: 'TEMPLE50', devotee: 'Anjali Nair', poojaSummary: 'Archana · 1 devotee', date: '10 Jul 26', amount: 250, paid: true },
  { orderRef: 'ORD-8790', code: 'SEVA', devotee: 'Suresh Pillai', poojaSummary: 'Neyyabhishekam · 1 devotee', date: '5 Jul 26', amount: 750, paid: true },
  { orderRef: 'ORD-8801', code: 'SEVA', devotee: 'Deepa Warrier', poojaSummary: 'Pushpanjali · 3 devotees', date: '2 Jul 26', amount: 450, paid: false },
  { orderRef: 'ORD-8905', code: 'GURUKRIPA', devotee: 'Vishnu Prasad', poojaSummary: 'Guru Puja · 1 devotee', date: '19 Jul 26', amount: 1100, paid: true },
]
