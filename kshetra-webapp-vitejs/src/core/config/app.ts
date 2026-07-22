/** App-wide constants. Env values are read here once (see env.ts). */

export const APP_NAME = 'Kshetra'
export const BRAND_MARK = 'क'

/** Default list page sizes offered across list views. */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 20

/** Layout geometry (matches the design shell). */
export const TOPBAR_HEIGHT = 60
export const SIDEBAR_WIDTH = 240
/** Below this viewport width the sidebar collapses to an overlay drawer. */
export const NARROW_BREAKPOINT = 900
