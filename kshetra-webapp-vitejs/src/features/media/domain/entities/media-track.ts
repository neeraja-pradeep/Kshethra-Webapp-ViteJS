/** Whether a track is served in the devotee app or hidden. */
export type MediaTrackStatus = 'Active' | 'Inactive'

/** An audio track served in the devotee app (chants, stotras, etc). */
export interface MediaTrack {
  readonly id: string
  readonly title: string
  readonly artist: string
  /** Original file name of the uploaded audio (display only in this layer). */
  readonly audioName: string
  /** Data-URI / URL of the uploaded cover art, or null when none was set. */
  readonly cover: string | null
  /** Featured on the devotee app home screen. */
  readonly homescreen: boolean
  /** Lifetime play count reported by the app; null for tracks with no data yet. */
  readonly plays: number | null
  readonly status: MediaTrackStatus
}

/** Editable draft shape used by the create/edit form (no id assigned yet). */
export type MediaTrackDraft = Omit<MediaTrack, 'id'>
