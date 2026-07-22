import { BRAND_MARK } from '@/core/config/app'

/**
 * Centered brand mark shown above the form on narrow viewports, replacing
 * the left brand panel that only wide layouts have room for.
 */
export function AuthCompactBrand() {
  return (
    <div className="flex flex-col items-center gap-2.75 pb-1.5 lg:hidden">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-contrast">
        {BRAND_MARK}
      </span>
      <div className="text-center">
        <div className="text-base font-bold tracking-tight text-ink-strong">Kshetra Admin</div>
        <div className="mt-0.5 text-2xs text-ink-subtle">Peramangalam · Sree Nagaraja Kshetram</div>
      </div>
    </div>
  )
}
