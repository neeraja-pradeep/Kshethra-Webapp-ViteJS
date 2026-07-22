/** Design-token colour tone driving a fulfilment stage's icon + progress fill. */
export type FulfilmentStageTone = 'primary' | 'warning' | 'info' | 'success'

/**
 * One row of the store fulfilment progress — a stage in the order lifecycle
 * (Processing → Packed → Shipped → Delivered) and how many of the last-15
 * orders currently sit in it. The progress-bar width is derived from the
 * group's max count at render time, not stored.
 */
export interface FulfilmentStage {
  readonly label: string
  readonly icon: string
  readonly tone: FulfilmentStageTone
  readonly count: number
}
