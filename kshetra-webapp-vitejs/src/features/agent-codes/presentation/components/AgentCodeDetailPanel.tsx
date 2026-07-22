import { AgentCodeDeleteCard } from './AgentCodeDeleteCard'
import { AgentCodeDetailHeader } from './AgentCodeDetailHeader'
import type { AgentCodeFormErrors, AgentCodeFormField, AgentCodeFormValues } from './AgentCodeFormCard'
import { AgentCodeFormCard } from './AgentCodeFormCard'
import type { AgentCodeUsageRowView } from './AgentCodeUsageCard'
import { AgentCodeUsageCard } from './AgentCodeUsageCard'

export interface AgentCodeDetailPanelProps {
  title: string
  isView: boolean
  onBack: () => void
  onStartEdit: () => void
  onSave: () => void
  form: AgentCodeFormValues
  errors: AgentCodeFormErrors
  fromDisplay: string
  toDisplay: string
  onFieldChange: (field: AgentCodeFormField, value: string) => void
  onStatusToggle: () => void
  /** Usage history + delete are only relevant once a code already exists. */
  isExistingRecord: boolean
  usedLabel: string
  orderValueLabel: string
  usageSummary: string
  usageRows: AgentCodeUsageRowView[]
  deleteDisabled: boolean
  deleteNote: string
  onDelete: () => void
}

/** Full-screen create/edit/view overlay for a single agent code. */
export function AgentCodeDetailPanel({
  title,
  isView,
  onBack,
  onStartEdit,
  onSave,
  form,
  errors,
  fromDisplay,
  toDisplay,
  onFieldChange,
  onStatusToggle,
  isExistingRecord,
  usedLabel,
  orderValueLabel,
  usageSummary,
  usageRows,
  deleteDisabled,
  deleteNote,
  onDelete,
}: AgentCodeDetailPanelProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-sunken">
      <AgentCodeDetailHeader title={title} isView={isView} isEditing={!isView} onBack={onBack} onStartEdit={onStartEdit} onSave={onSave} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-6 pb-14 pt-6">
          <AgentCodeFormCard
            mode={isView ? 'view' : 'edit'}
            form={form}
            errors={errors}
            fromDisplay={fromDisplay}
            toDisplay={toDisplay}
            onFieldChange={onFieldChange}
            onStatusToggle={onStatusToggle}
          />

          {isExistingRecord && (
            <>
              <AgentCodeUsageCard usedLabel={usedLabel} orderValueLabel={orderValueLabel} summaryLabel={usageSummary} rows={usageRows} />
              <AgentCodeDeleteCard disabled={deleteDisabled} note={deleteNote} onDelete={onDelete} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
