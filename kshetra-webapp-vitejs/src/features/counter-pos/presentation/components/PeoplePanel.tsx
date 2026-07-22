import { Icon, Input, Select } from '@/shared/ui'
import type { SelectOption } from '@/shared/ui'

import type { BookingPerson } from '@/features/counter-pos/domain/entities/booking'

export interface PeoplePanelProps {
  people: readonly BookingPerson[]
  nakshatraOptions: readonly SelectOption[]
  onNameChange: (id: string, value: string) => void
  onNakshatraChange: (id: string, value: string) => void
  onRemove: (id: string) => void
  onAddPerson: () => void
}

/** The current booking's roster — devotee + family members, this booking only. */
export function PeoplePanel({ people, nakshatraOptions, onNameChange, onNakshatraChange, onRemove, onAddPerson }: PeoplePanelProps) {
  const namedCount = people.filter((p) => p.name.trim()).length

  return (
    <div className="flex flex-shrink-0 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-stroke-subtle px-4 pb-2.75 pt-3.25">
        <Icon name="users-three" size={18} className="text-primary" />
        <span className="text-base font-semibold text-ink-strong">People</span>
        <span className="text-xs text-ink-subtle">· this booking only, no account saved</span>
        <div className="flex-1" />
        <span className="text-xs text-ink-subtle">
          {namedCount} {namedCount === 1 ? 'person' : 'people'}
        </span>
      </div>

      <div className="flex max-h-[170px] flex-col gap-2 overflow-y-auto px-4 py-2.5">
        {people.map((p, i) => (
          <div key={p.id} className="grid grid-cols-[62px_2fr_1.4fr_30px] items-center gap-2.25">
            <span className="flex-shrink-0 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
              {i === 0 ? 'Devotee' : 'Family'}
            </span>
            <Input
              size="sm"
              placeholder={i === 0 ? 'Devotee name' : 'Family member name'}
              value={p.name}
              onChange={(e) => onNameChange(p.id, e.target.value)}
            />
            <Select
              size="sm"
              options={[{ value: '', label: 'Nakshatra' }, ...nakshatraOptions]}
              value={p.nakshatra}
              onChange={(e) => onNakshatraChange(p.id, e.target.value)}
            />
            {people.length > 1 ? (
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                aria-label="Remove person"
                className="flex h-7.5 w-7.5 flex-shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-subtle hover:bg-danger-surface hover:text-danger"
              >
                <Icon name="x" size={15} />
              </button>
            ) : (
              <span className="w-7.5 flex-shrink-0" />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onAddPerson}
          className="ml-[71px] inline-flex h-8 items-center gap-1.75 self-start rounded-md bg-transparent px-3 text-sm font-medium text-primary shadow-xs hover:bg-hover"
        >
          <Icon name="plus" size={15} />
          Add person
        </button>
      </div>
    </div>
  )
}
