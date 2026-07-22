/** Report catalogue grouping shown as the section overline above the cards. */
export type ReportCategory = 'Financial' | 'Operational' | 'Staff' | 'Inventory' | 'Expense'

/** Identifies a report definition + its dataset key in the mock store. */
export type ReportId =
  | 'income'
  | 'refunds'
  | 'counter'
  | 'agent'
  | 'temple'
  | 'monthly'
  | 'volume'
  | 'cancellations'
  | 'attendance'
  | 'incentive'
  | 'inventory'
  | 'expense'

/** Quick date-range chooser above the results panel. */
export type DateRangePreset = 'Today' | 'This week' | 'This month' | 'This quarter' | 'This year' | 'Custom range'

/** A single extra filter offered by a report (beyond the shared date range). */
export interface ReportFilterDef {
  readonly key: string
  readonly label: string
  readonly options: readonly string[]
}

/** A result-table column definition for a report. */
export interface ReportColumn {
  readonly key: string
  readonly label: string
  readonly money?: boolean
  readonly num?: boolean
  readonly delta?: boolean
}

/** One entry in the report catalogue (rendered as a card). */
export interface ReportDefinition {
  readonly id: ReportId
  readonly category: ReportCategory
  readonly icon: string
  readonly name: string
  readonly description: string
  readonly flagged?: boolean
  readonly pendingNote?: string
  readonly noDate?: boolean
  readonly filters: readonly ReportFilterDef[]
  readonly columns: readonly ReportColumn[]
  readonly totals: readonly string[]
}

/** A named group of report cards (rendered as one catalogue section). */
export interface ReportGroup {
  readonly category: ReportCategory
  readonly reports: readonly ReportDefinition[]
}

/** Applied/draft filter state shared by every report. */
export interface ReportFilterState {
  readonly preset: DateRangePreset
  readonly from: string
  readonly to: string
  readonly extra: Readonly<Record<string, string>>
}

// ── Row shapes, one per report dataset ─────────────────────────────────────

export interface IncomeRow {
  readonly id: string
  readonly date: string
  readonly source: string
  readonly mode: string
  readonly gross: number
  readonly refunds: number
  readonly net: number
}

export interface RefundRow {
  readonly id: string
  readonly ref: string
  readonly order: string
  readonly type: string
  readonly source: string
  readonly amount: number
  readonly reason: string
  readonly user: string
  readonly date: string
}

export interface CounterRow {
  readonly id: string
  readonly date: string
  readonly staff: string
  readonly mode: string
  readonly amount: number
  readonly count: number
}

export interface AgentRow {
  readonly id: string
  readonly code: string
  readonly uses: number
  readonly value: number
  readonly discount: number
}

export interface MonthlyPrev {
  readonly poojas: number
  readonly orders: number
  readonly revenue: number
  readonly net: number
}

export interface MonthlyRow {
  readonly id: string
  readonly month: string
  readonly poojas: number
  readonly orders: number
  readonly revenue: number
  readonly refunds: number
  readonly net: number
  readonly prev: MonthlyPrev | null
}

export interface VolumeRow {
  readonly id: string
  readonly pooja: string
  readonly god: string
  readonly booked: number
  readonly completed: number
  readonly cancelled: number
  readonly revenue: number
}

export interface CancellationRow {
  readonly id: string
  readonly ref: string
  readonly date: string
  readonly source: string
  readonly reason: string
  readonly amount: number
  readonly user: string
}

export type StockFlag = 'In stock' | 'Low stock' | 'Out of stock'

export interface InventoryRow {
  readonly id: string
  readonly product: string
  readonly category: string
  readonly stock: number
  readonly adjustments: number
  readonly flag: StockFlag
}

export interface TempleRow {
  readonly id: string
  readonly temple: string
  readonly gross: number
  readonly refunds: number
  readonly net: number
}

export interface AttendanceRow {
  readonly id: string
  readonly poojari: string
  readonly days: number
  readonly completed: number
}

export interface IncentiveRow {
  readonly id: string
  readonly poojari: string
  readonly completed: number
  readonly incentive: number
}

export interface ExpenseRow {
  readonly id: string
  readonly date: string
  readonly category: string
  readonly description: string
  readonly amount: number
}

/** Union of every possible result row across all reports. */
export type ReportRow =
  | IncomeRow
  | RefundRow
  | CounterRow
  | AgentRow
  | MonthlyRow
  | VolumeRow
  | CancellationRow
  | InventoryRow
  | TempleRow
  | AttendanceRow
  | IncentiveRow
  | ExpenseRow

/** The full mock dataset store, keyed by report id. */
export interface ReportDataset {
  readonly income: readonly IncomeRow[]
  readonly refunds: readonly RefundRow[]
  readonly counter: readonly CounterRow[]
  readonly agent: readonly AgentRow[]
  readonly monthly: readonly MonthlyRow[]
  readonly volume: readonly VolumeRow[]
  readonly cancellations: readonly CancellationRow[]
  readonly inventory: readonly InventoryRow[]
  readonly temple: readonly TempleRow[]
  readonly attendance: readonly AttendanceRow[]
  readonly incentive: readonly IncentiveRow[]
  readonly expense: readonly ExpenseRow[]
}
