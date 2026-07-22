import { Icon, Tag } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

import type { NotificationAudience } from '@/features/notifications/domain/entities/notification'
import { ComposeViewField } from '@/features/notifications/presentation/components/ComposeViewField'
import { notificationAudienceLabel } from '@/features/notifications/presentation/lib/notification-format'

interface ComposeAudienceSectionProps {
  mode: 'view' | 'edit'
  target: NotificationAudience
  naks: readonly string[]
  naksError: boolean
  nakshatras: readonly string[]
  onTargetChange: (value: NotificationAudience) => void
  onToggleNakshatra: (name: string) => void
}

/** Audience targeting card: all users vs. a set of nakshatras. */
export function ComposeAudienceSection({
  mode,
  target,
  naks,
  naksError,
  nakshatras,
  onTargetChange,
  onToggleNakshatra,
}: ComposeAudienceSectionProps) {
  return (
    <section className="flex flex-col gap-3.5 rounded-2xl bg-card p-5.5 shadow-sm">
      <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Audience</span>

      {mode === 'edit' ? (
        <>
          <div className="flex flex-wrap gap-2">
            <AudienceOptionButton
              active={target === 'all'}
              icon="users"
              label="All users"
              hint="Everyone with the app"
              onClick={() => onTargetChange('all')}
            />
            <AudienceOptionButton
              active={target === 'nakshatra'}
              icon="star-four"
              label="By Nakshatra"
              hint="Account holders + family"
              onClick={() => onTargetChange('nakshatra')}
            />
          </div>
          {target === 'nakshatra' && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-ink">Select nakshatras</span>
              <div className="flex flex-wrap gap-1.5">
                {nakshatras.map((n) => {
                  const active = naks.includes(n)
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onToggleNakshatra(n)}
                      className={cn(
                        'cursor-pointer whitespace-nowrap rounded-full border-none px-3 py-1.5 text-xs font-medium',
                        active ? 'bg-primary text-white' : 'bg-card text-ink shadow-[inset_0_0_0_1px_var(--border-default)]',
                      )}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              {naksError && <span className="text-xs text-danger">Select at least one nakshatra.</span>}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <ComposeViewField label="Audience" value={notificationAudienceLabel({ target, naks })} />
          {target === 'nakshatra' && naks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {naks.map((n) => (
                <Tag key={n} size="sm" active>
                  {n}
                </Tag>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

interface AudienceOptionButtonProps {
  active: boolean
  icon: string
  label: string
  hint: string
  onClick: () => void
}

function AudienceOptionButton({ active, icon, label, hint, onClick }: AudienceOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-w-[160px] flex-1 cursor-pointer items-center gap-2.5 rounded-lg border-none px-3.5 py-3.25 text-left font-sans',
        active ? 'bg-primary-subtle shadow-[inset_0_0_0_1.5px_var(--color-primary)]' : 'bg-card shadow-[inset_0_0_0_1px_var(--border-default)]',
      )}
    >
      <Icon name={icon} size={19} className={active ? 'text-primary-subtle-text' : 'text-ink-strong'} />
      <span className="flex flex-col gap-px">
        <span className={cn('text-sm font-semibold', active ? 'text-primary-subtle-text' : 'text-ink-strong')}>{label}</span>
        <span className="text-2xs text-ink-subtle">{hint}</span>
      </span>
    </button>
  )
}
