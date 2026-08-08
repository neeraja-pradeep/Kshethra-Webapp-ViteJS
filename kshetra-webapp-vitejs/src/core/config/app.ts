/** App-wide constants. Env values are read here once (see env.ts). */

export const APP_NAME = 'Kshetra'
/** Printed on counter receipts. No backend field exposes this yet. */
export const TEMPLE_NAME = 'Sri Kshetra Devasthanam'
export const BRAND_MARK = 'क'

/** Default list page sizes offered across list views. */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 20

/** Layout geometry (matches the design shell). */
export const TOPBAR_HEIGHT = 60
export const SIDEBAR_WIDTH = 240
/** Below this viewport width the sidebar collapses to an overlay drawer. */
export const NARROW_BREAKPOINT = 900

/** The server mounts every route under this prefix (Django `path("api/", ...)`). */
export const API_PREFIX = '/api'
/** Requests are aborted after this long — a hung counter till is worse than an error. */
export const API_TIMEOUT_MS = 20_000
