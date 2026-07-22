/** Lifecycle state of a broadcast notification. */
export type NotificationStatus = 'Draft' | 'Scheduled' | 'Sent'

/** Who a notification is targeted at. */
export type NotificationAudience = 'all' | 'nakshatra'

/** When a notification is (or was) delivered. */
export type NotificationDelivery = 'now' | 'schedule'

/** A broadcast message sent — or scheduled, or drafted — to app users. */
export interface Notification {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly target: NotificationAudience
  /** Nakshatra names this notification targets; empty when target is 'all'. */
  readonly naks: readonly string[]
  /** Whether this notification also shows as a banner on the app home screen. */
  readonly banner: boolean
  readonly status: NotificationStatus
  /** "YYYY-MM-DD HH:mm" sent/scheduled timestamp; empty string for drafts. */
  readonly time: string
}
