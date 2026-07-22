import type { Devotee } from '@/features/devotees/domain/entities/devotee'

import { DevoteeAccountCard } from './DevoteeAccountCard'
import { DevoteeBookingHistoryCard } from './DevoteeBookingHistoryCard'
import { DevoteeDetailHeader } from './DevoteeDetailHeader'
import type { EditFamilyMember } from './DevoteeFamilyCard'
import { DevoteeFamilyCard } from './DevoteeFamilyCard'
import { DevoteeLifecycleCard } from './DevoteeLifecycleCard'

export interface DevoteeDetailPanelProps {
  devotee: Devotee
  editing: boolean
  editPhone: string
  editEmail: string
  editFamily: readonly EditFamilyMember[]
  onBack: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onEditPhoneChange: (value: string) => void
  onEditEmailChange: (value: string) => void
  onFamilyNameChange: (id: string, name: string) => void
  onFamilyNakshatraChange: (id: string, nakshatra: string) => void
  onRemoveFamilyMember: (id: string) => void
  onAddFamilyMember: () => void
  onSuspend: () => void
  onReactivate: () => void
  onDelete: () => void
  onOpenBooking?: (ref: string) => void
}

/** Full-screen account detail: header bar + account/family cards + booking history + lifecycle. */
export function DevoteeDetailPanel({
  devotee,
  editing,
  editPhone,
  editEmail,
  editFamily,
  onBack,
  onEdit,
  onCancelEdit,
  onSave,
  onEditPhoneChange,
  onEditEmailChange,
  onFamilyNameChange,
  onFamilyNakshatraChange,
  onRemoveFamilyMember,
  onAddFamilyMember,
  onSuspend,
  onReactivate,
  onDelete,
  onOpenBooking,
}: DevoteeDetailPanelProps) {
  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <DevoteeDetailHeader devotee={devotee} editing={editing} onBack={onBack} onEdit={onEdit} onCancelEdit={onCancelEdit} onSave={onSave} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-4 p-6 pb-14">
          <div className="flex flex-wrap items-start gap-4">
            <DevoteeAccountCard
              devotee={devotee}
              editing={editing}
              editPhone={editPhone}
              editEmail={editEmail}
              onEditPhoneChange={onEditPhoneChange}
              onEditEmailChange={onEditEmailChange}
            />
            <DevoteeFamilyCard
              devotee={devotee}
              editing={editing}
              editFamily={editFamily}
              onFamilyNameChange={onFamilyNameChange}
              onFamilyNakshatraChange={onFamilyNakshatraChange}
              onRemoveFamilyMember={onRemoveFamilyMember}
              onAddFamilyMember={onAddFamilyMember}
            />
          </div>

          <DevoteeBookingHistoryCard devotee={devotee} onOpenBooking={onOpenBooking} />

          <DevoteeLifecycleCard devotee={devotee} onSuspend={onSuspend} onReactivate={onReactivate} onDelete={onDelete} />
        </div>
      </div>
    </div>
  )
}
