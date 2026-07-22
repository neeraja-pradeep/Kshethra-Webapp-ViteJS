import { Icon, Input, Select } from '@/shared/ui'

import type { Devotee } from '@/features/devotees/domain/entities/devotee'
import { NAKSHATRAS } from '@/features/devotees/presentation/data/nakshatras.mock'

/** A family-member row while in edit mode — carries a client-only id for stable keys. */
export interface EditFamilyMember {
  readonly id: string
  readonly name: string
  readonly nakshatra: string
}

const NAKSHATRA_OPTIONS = [{ value: '', label: 'Nakshatra' }, ...NAKSHATRAS.map((n) => ({ value: n, label: n }))]

export interface DevoteeFamilyCardProps {
  devotee: Devotee
  editing: boolean
  editFamily: readonly EditFamilyMember[]
  onFamilyNameChange: (id: string, name: string) => void
  onFamilyNakshatraChange: (id: string, nakshatra: string) => void
  onRemoveFamilyMember: (id: string) => void
  onAddFamilyMember: () => void
}

/** Family members linked to the account, view list or inline editor. */
export function DevoteeFamilyCard({
  devotee,
  editing,
  editFamily,
  onFamilyNameChange,
  onFamilyNakshatraChange,
  onRemoveFamilyMember,
  onAddFamilyMember,
}: DevoteeFamilyCardProps) {
  const familyCountLabel = `${devotee.family.length} ${devotee.family.length === 1 ? 'member' : 'members'}`

  return (
    <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Family</span>
        <div className="flex-1" />
        <span className="text-2xs text-ink-subtle">{familyCountLabel}</span>
      </div>

      {!editing && (
        <div className="flex flex-col gap-2">
          {devotee.family.map((member, index) => (
            <div key={`${devotee.id}-fam-${index}`} className="flex items-center gap-2.5 rounded-md bg-sunken px-2.75 py-2.25">
              <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-card text-ink-muted shadow-xs">
                <Icon name="user" size={14} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium text-ink-strong">{member.name}</span>
              <span className="text-2xs text-ink-subtle">{member.nakshatra}</span>
            </div>
          ))}
          {devotee.family.length === 0 && <div className="px-0.5 py-2 text-sm text-ink-subtle">No family members on this account.</div>}
        </div>
      )}

      {editing && (
        <div className="flex flex-col gap-2">
          {editFamily.map((member) => (
            <div key={member.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-[2]">
                <Input size="sm" placeholder="Name" value={member.name} onChange={(e) => onFamilyNameChange(member.id, e.target.value)} containerStyle={{ width: '100%' }} />
              </div>
              <div className="min-w-0 flex-[1.4]">
                <Select
                  size="sm"
                  options={NAKSHATRA_OPTIONS}
                  value={member.nakshatra}
                  onChange={(e) => onFamilyNakshatraChange(member.id, e.target.value)}
                  containerStyle={{ width: '100%' }}
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveFamilyMember(member.id)}
                aria-label="Remove family member"
                className="flex h-7.5 w-7.5 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-ink-subtle hover:bg-danger-surface hover:text-danger"
              >
                <Icon name="x" size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddFamilyMember}
            className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.75 self-start rounded-md border-none bg-transparent px-3 text-sm font-medium text-primary shadow-xs hover:bg-hover"
          >
            <Icon name="plus" size={15} />
            Add family member
          </button>
        </div>
      )}
    </div>
  )
}
