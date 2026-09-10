/**
 * Domain types for App > Media. Plain data — no logic, no React.
 */

/**
 * Whether the devotee app serves the track at all.
 *
 * Independent of {@link MediaTrack.homeScreen}: a track can be featured **and**
 * inactive, which legally means "ready but not yet live". Never derive one from
 * the other, and never disable the home-screen switch because a track is off.
 */
export type MediaTrackStatus = 'active' | 'inactive'

/** One row of the library table. */
export interface MediaTrack {
  readonly id: number
  readonly title: string
  readonly artist: string
  /** Player art. `null` → render the letter tile. */
  readonly coverUrl: string | null
  /** `true` prints "Featured" in the HOME SCREEN column. */
  readonly homeScreen: boolean
  /** Exact — the API never rounds it. The table rounds for display. */
  readonly playCount: number
  readonly status: MediaTrackStatus
  /** UTC, `Z`-suffixed. */
  readonly uploadedAt: string
}

/** The track's own page — the row plus what only the detail draws. */
export interface MediaTrackDetail extends MediaTrack {
  /** The name of the file that was uploaded, not the CDN's identifier. */
  readonly audioFilename: string | null
  readonly homeCoverUrl: string | null
  /** **Seconds, as a float** (`421.0`). Formatted as MM:SS for display. */
  readonly duration: number | null
}

/** The three tiles above the table. */
export interface MediaSummary {
  readonly total: number
  readonly active: number
  readonly inactive: number
}

/** A page of the table, plus the counts the tiles read. */
export interface MediaTrackPage {
  readonly count: number
  readonly results: readonly MediaTrack[]
  /**
   * Counted over `search` and `homeScreen` but **deliberately not over
   * `status`** — a tile is how that filter is applied, so counting it into its
   * own total would zero the other two on the first click. Render the tiles
   * from here, never from `results.length`.
   */
  readonly summary: MediaSummary
}

/**
 * What the create and edit forms write.
 *
 * `audioFile` is mandatory on create and replaces the audio on edit — omitting
 * it leaves the existing file alone, so renaming a track does not mean
 * re-uploading it. For the two images, **`null` clears and absent leaves
 * alone**, which is how the form's remove button works.
 */
export interface MediaTrackWrite {
  readonly title?: string
  /** Required by the API on create, even though the form does not star it. */
  readonly artist?: string
  readonly audioFile?: File
  readonly cover?: File | null
  readonly homeCover?: File | null
  readonly homeScreen?: boolean
  readonly status?: MediaTrackStatus
}
