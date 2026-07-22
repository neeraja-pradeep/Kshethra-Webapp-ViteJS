import { BRAND_MARK } from '@/core/config/app'
import { Icon } from '@/shared/ui'

/**
 * Left-hand brand panel of the auth card — flat temple-maroon fill, shown on
 * wide viewports only (the form takes the full card below the breakpoint).
 */
export function AuthBrandPanel() {
  return (
    <div className="relative hidden w-[44%] shrink-0 flex-col bg-primary px-10 py-11 text-white lg:flex">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]">
          {BRAND_MARK}
        </span>
        <span className="text-lg font-bold tracking-tight">Kshetra Admin</span>
      </div>

      <div className="flex-1" />

      <div>
        <div className="text-2xs font-semibold uppercase tracking-overline-lg text-white/60">Peramangalam</div>
        <div className="mt-2.5 text-5xl font-bold leading-tight tracking-tight">
          Sree Nagaraja
          <br />
          Kshetram
        </div>
        <div className="mt-4.5 max-w-[330px] text-sm leading-relaxed text-white/80">
          The admin console for temple operations — poojas, bookings, store, and devotees, managed with care.
        </div>
      </div>

      <div className="mt-9 flex items-center gap-2 text-2xs text-white/65">
        <Icon name="shield-check" size={16} color="currentColor" />
        <span>Secure, role-based access for temple staff</span>
      </div>
    </div>
  )
}
