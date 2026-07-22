/** A pooja (seva) offered by the temple, with pricing + availability. */
export type PoojaStatus = 'Active' | 'Inactive'

export type ScheduleFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
export type MonthlyMode = 'dom' | 'dow'
export type CustomUnit = 'weeks' | 'months'
export type ScheduleEndMode = 'never' | 'on' | 'after'

/** Recurring-availability rule for a special pooja. */
export interface PoojaSchedule {
  readonly frequency: ScheduleFrequency
  readonly startDate: string
  readonly weekdays: readonly number[]
  readonly monthlyMode: MonthlyMode
  readonly monthlyDom: string
  readonly monthlyOrdinal: string
  readonly monthlyWeekday: number
  readonly customUnit: CustomUnit
  readonly customInterval: string
  readonly endMode: ScheduleEndMode
  readonly endDate: string
  readonly endCount: string
}

/** A one-off date with its own pricing. */
export interface SpecificDate {
  readonly date: string
  readonly offlinePrice: number
  readonly onlinePrice: number
  readonly incentive?: number
}

/** A blocked date or range when the pooja can't be booked. */
export interface UnavailableRange {
  readonly start: string
  readonly end: string
}

export interface Pooja {
  readonly id: string
  readonly godIds: readonly string[]
  /** Denormalised god display names, for list rendering without a join. */
  readonly godNames: readonly string[]
  readonly name: string
  readonly offlinePrice: number
  readonly onlinePrice: number
  readonly incentive?: number
  readonly status: PoojaStatus
  readonly sortOrder: number
  readonly special: boolean
  readonly cardImage: string | null
  readonly cardDesc: string
  readonly bannerImage: string | null
  readonly bannerDesc: string
  readonly schedule: PoojaSchedule | null
  readonly specificDates: readonly SpecificDate[]
  readonly unavailable: readonly UnavailableRange[]
}
