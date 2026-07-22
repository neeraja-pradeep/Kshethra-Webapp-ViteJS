import { Button, Icon } from '@/shared/ui'

import type { NotificationAudience, NotificationDelivery } from '@/features/notifications/domain/entities/notification'
import { ComposeAudienceSection } from '@/features/notifications/presentation/components/ComposeAudienceSection'
import { ComposeBannerSection } from '@/features/notifications/presentation/components/ComposeBannerSection'
import { ComposeDeliverySection } from '@/features/notifications/presentation/components/ComposeDeliverySection'
import { ComposeMessageSection } from '@/features/notifications/presentation/components/ComposeMessageSection'

/** Mutable compose-form shape — presentation-only UI state, not a domain entity. */
export interface NotificationFormValues {
  title: string
  description: string
  banner: boolean
  bannerImage: string | null
  poojaId: string
  target: NotificationAudience
  naks: string[]
  delivery: NotificationDelivery
  schedDate: string
  schedTime: string
}

export interface NotificationFormErrors {
  title?: string
  naks?: boolean
  sched?: boolean
}

interface ComposeNotificationViewProps {
  mode: 'view' | 'edit'
  title: string
  form: NotificationFormValues
  errors: NotificationFormErrors
  nakshatras: readonly string[]
  poojaNames: readonly string[]
  recipientEstimateLabel: string
  onCancel: () => void
  onStartEdit: () => void
  onSaveDraft: () => void
  onSend: () => void
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onBannerToggle: (checked: boolean) => void
  onBannerImageChange: (file: File) => void
  onRemoveBannerImage: () => void
  onPoojaChange: (value: string) => void
  onTargetChange: (value: NotificationAudience) => void
  onToggleNakshatra: (name: string) => void
  onDeliveryChange: (value: NotificationDelivery) => void
  onSchedDateChange: (value: string) => void
  onSchedTimeChange: (value: string) => void
}

/** Full-screen compose/edit experience for a broadcast notification. */
export function ComposeNotificationView({
  mode,
  title,
  form,
  errors,
  nakshatras,
  poojaNames,
  recipientEstimateLabel,
  onCancel,
  onStartEdit,
  onSaveDraft,
  onSend,
  onTitleChange,
  onDescriptionChange,
  onBannerToggle,
  onBannerImageChange,
  onRemoveBannerImage,
  onPoojaChange,
  onTargetChange,
  onToggleNakshatra,
  onDeliveryChange,
  onSchedDateChange,
  onSchedTimeChange,
}: ComposeNotificationViewProps) {
  const isView = mode === 'view'
  const sendLabel = form.delivery === 'schedule' ? 'Schedule' : 'Send now'

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-sunken">
      <div className="flex h-14 flex-shrink-0 items-center gap-2.5 border-b-[0.5px] border-stroke bg-card px-6">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back"
          className="inline-flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-ink-muted hover:bg-hover hover:text-ink-strong"
        >
          <Icon name="arrow-left" size={18} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-overline text-ink-subtle">App · Notifications</span>
          <span className="text-stroke-strong">/</span>
          <span className="min-w-0 flex-1 truncate whitespace-nowrap text-base font-semibold text-ink-strong">{title}</span>
        </div>

        {isView ? (
          <>
            <span className="inline-flex h-6.5 items-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-2.75 text-xs font-medium text-ink-muted shadow-[inset_0_0_0_1px_var(--border-subtle)]">
              <Icon name="eye" size={13} />
              View only
            </span>
            <Button theme="primary" iconLeft={<Icon name="pencil-simple" size={15} />} onClick={onStartEdit}>
              Edit
            </Button>
          </>
        ) : (
          <>
            <Button theme="default" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button theme="default" variant="outline" iconLeft={<Icon name="floppy-disk" size={15} />} onClick={onSaveDraft}>
              Save draft
            </Button>
            <Button theme="primary" iconLeft={<Icon name="paper-plane-tilt" size={15} />} onClick={onSend}>
              {sendLabel}
            </Button>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-6 pb-14 pt-6">
          <ComposeMessageSection
            mode={mode}
            title={form.title}
            description={form.description}
            titleError={errors.title}
            onTitleChange={onTitleChange}
            onDescriptionChange={onDescriptionChange}
          />
          <ComposeBannerSection
            mode={mode}
            banner={form.banner}
            bannerImage={form.bannerImage}
            poojaId={form.poojaId}
            poojaNames={poojaNames}
            onBannerToggle={onBannerToggle}
            onBannerImageChange={onBannerImageChange}
            onRemoveBannerImage={onRemoveBannerImage}
            onPoojaChange={onPoojaChange}
          />
          <ComposeAudienceSection
            mode={mode}
            target={form.target}
            naks={form.naks}
            naksError={!!errors.naks}
            nakshatras={nakshatras}
            onTargetChange={onTargetChange}
            onToggleNakshatra={onToggleNakshatra}
          />
          <ComposeDeliverySection
            mode={mode}
            delivery={form.delivery}
            schedDate={form.schedDate}
            schedTime={form.schedTime}
            schedError={!!errors.sched}
            recipientEstimateLabel={recipientEstimateLabel}
            onDeliveryChange={onDeliveryChange}
            onSchedDateChange={onSchedDateChange}
            onSchedTimeChange={onSchedTimeChange}
          />
        </div>
      </div>
    </div>
  )
}
