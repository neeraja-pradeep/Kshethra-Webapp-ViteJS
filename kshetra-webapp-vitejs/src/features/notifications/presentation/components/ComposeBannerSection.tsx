import { Icon, Select, Switch } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

import { ComposeViewField } from '@/features/notifications/presentation/components/ComposeViewField'

interface ComposeBannerSectionProps {
  mode: 'view' | 'edit'
  banner: boolean
  bannerImage: string | null
  poojaId: string
  poojaNames: readonly string[]
  onBannerToggle: (checked: boolean) => void
  onBannerImageChange: (file: File) => void
  onRemoveBannerImage: () => void
  onPoojaChange: (value: string) => void
}

/** Home-screen banner toggle, image upload, and "map to pooja" card. */
export function ComposeBannerSection({
  mode,
  banner,
  bannerImage,
  poojaId,
  poojaNames,
  onBannerToggle,
  onBannerImageChange,
  onRemoveBannerImage,
  onPoojaChange,
}: ComposeBannerSectionProps) {
  const isEdit = mode === 'edit'

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Banner</span>
          {isEdit && <p className="m-0 mt-1 text-2xs text-ink-subtle">Show this as a banner on the app home screen.</p>}
        </div>
        {isEdit ? (
          <Switch checked={banner} onChange={(e) => onBannerToggle(e.target.checked)} label={banner ? 'On' : 'Off'} />
        ) : (
          <span className="inline-flex items-center gap-1.75 text-sm font-medium text-ink-strong">
            <span className={cn('h-2 w-2 rounded-full', banner ? 'bg-success' : 'bg-stroke-strong')} />
            {banner ? 'On' : 'Off'}
          </span>
        )}
      </div>

      {banner && isEdit && (
        <div className="flex flex-wrap items-start gap-3.5 pt-0.5">
          <div className="min-w-[240px] flex-1">
            <span className="text-sm font-medium text-ink">Banner image</span>
            <div className="mt-2">
              {bannerImage ? (
                <div className="relative h-[130px] w-full overflow-hidden rounded-lg bg-sunken shadow-[inset_0_0_0_1px_var(--border-default)]">
                  <img src={bannerImage} alt="Banner" className="block h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={onRemoveBannerImage}
                    aria-label="Remove banner image"
                    className="absolute right-2 top-2 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-none bg-overlay text-white"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              ) : (
                <label className="relative flex h-[110px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-stroke-strong bg-sunken text-ink-subtle hover:bg-hover">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onBannerImageChange(file)
                      e.target.value = ''
                    }}
                    className="absolute h-0 w-0 opacity-0"
                  />
                  <Icon name="image" size={22} />
                  <span className="text-sm">Upload banner image</span>
                </label>
              )}
            </div>
          </div>
          <div className="min-w-[240px] flex-1">
            <Select
              label="Map to pooja"
              hint="Tapping the banner opens this pooja."
              value={poojaId}
              onChange={(e) => onPoojaChange(e.target.value)}
              options={[{ value: '', label: 'Select a pooja' }, ...poojaNames.map((p) => ({ value: p, label: p }))]}
            />
          </div>
        </div>
      )}

      {banner && !isEdit && (
        <div className="flex flex-wrap items-start gap-3.5 pt-0.5">
          <div className="min-w-[240px] flex-1">
            {bannerImage ? (
              <div className="h-[130px] w-full overflow-hidden rounded-lg bg-sunken shadow-[inset_0_0_0_1px_var(--border-default)]">
                <img src={bannerImage} alt="Banner" className="block h-full w-full object-cover" />
              </div>
            ) : (
              <ComposeViewField label="Banner image" value="" />
            )}
          </div>
          <div className="min-w-[240px] flex-1">
            <ComposeViewField label="Map to pooja" value={poojaId} />
          </div>
        </div>
      )}
    </section>
  )
}
