/** One stat tile in the KPI band. */
export interface KpiItem {
  readonly key: string
  readonly value: string
  readonly label: string
  /** Tailwind background class for the status dot, e.g. "bg-success". */
  readonly dot?: string
}
