/**
 * Lucide → Phosphor icon names.
 *
 * The catalogue serves a [Lucide](https://lucide.dev) name so a new report's
 * card needs no frontend release; this app draws the Phosphor webfont. Most
 * names differ, so they are translated rather than passed through — an
 * untranslated name renders as a blank glyph, not an error, which is exactly
 * the kind of silent breakage a fallback should catch.
 *
 * An unmapped icon falls back to a generic chart glyph: a new report should
 * appear with a plain icon rather than an empty square.
 */
const LUCIDE_TO_PHOSPHOR: Readonly<Record<string, string>> = {
  flame: 'flame',
  'receipt-indian-rupee': 'receipt',
  'calendar-check': 'calendar-check',
  ban: 'prohibit',
  'undo-2': 'arrow-u-up-left',
  store: 'storefront',
  ticket: 'ticket',
  'user-round': 'user',
  'hand-coins': 'hand-coins',
  'clipboard-check': 'clipboard-text',
  'shield-check': 'shield-check',
  package: 'package',
}

const FALLBACK_ICON = 'chart-bar'

export function reportIconName(lucideName: string): string {
  return LUCIDE_TO_PHOSPHOR[lucideName] ?? FALLBACK_ICON
}
