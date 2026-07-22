/**
 * Stat tile — a single labelled number shown in a dashboard section header
 * (e.g. "8 · Poojas today"). Value is pre-formatted (Indian digit grouping,
 * ₹ prefix where relevant) so the UI never reformats it.
 */
export interface StatTile {
  readonly value: string
  readonly label: string
}
