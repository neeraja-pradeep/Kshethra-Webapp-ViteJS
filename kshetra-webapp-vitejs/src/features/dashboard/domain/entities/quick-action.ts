/** Identifies a dashboard quick action so the screen can wire its handler. */
export type QuickActionId = 'new-counter-booking' | 'add-pooja' | 'send-notification'

/**
 * A quick-action button in the dashboard header. `primary` marks the single
 * solid maroon CTA; the rest render as plain outlined buttons.
 */
export interface QuickAction {
  readonly id: QuickActionId
  readonly label: string
  readonly icon: string
  readonly primary: boolean
}
