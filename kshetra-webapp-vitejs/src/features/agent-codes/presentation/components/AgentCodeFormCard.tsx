import type { ChangeEvent, ReactNode } from 'react'

import { Input, Switch } from '@/shared/ui'

import type { AgentCodeStatus } from '@/features/agent-codes/domain/entities/agent-code'

export interface AgentCodeFormValues {
  readonly code: string
  readonly description: string
  readonly from: string
  readonly to: string
  readonly limit: string
  readonly status: AgentCodeStatus
}

export interface AgentCodeFormErrors {
  readonly code?: string
  readonly dates?: boolean
}

export type AgentCodeFormField = 'code' | 'description' | 'from' | 'to' | 'limit'

export interface AgentCodeFormCardProps {
  mode: 'view' | 'edit'
  form: AgentCodeFormValues
  errors: AgentCodeFormErrors
  /** Formatted "Valid from" for view mode, e.g. "1 Jun 26". */
  fromDisplay: string
  /** Formatted "Valid to" for view mode. */
  toDisplay: string
  onFieldChange: (field: AgentCodeFormField, value: string) => void
  onStatusToggle: () => void
}

function FieldView({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{label}</span>
      <span className={mono ? 'font-mono text-lg font-medium tracking-wide text-ink-strong' : 'text-lg font-medium text-ink-strong'}>{value}</span>
    </div>
  )
}

/** Core code fields: code, description, validity window, usage limit, status. */
export function AgentCodeFormCard({ mode, form, errors, fromDisplay, toDisplay, onFieldChange, onStatusToggle }: AgentCodeFormCardProps) {
  const isView = mode === 'view'
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
      <div>
        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Code</div>
        {!isView && <div className="mt-1 text-2xs text-ink-subtle">Applied in the app; the booking then becomes payable at the counter.</div>}
      </div>

      {isView ? (
        <>
          <FieldView label="Code" value={form.code} mono />
          <FieldView label="Description / label" value={form.description || '—'} />
          <div className="flex flex-wrap gap-3">
            <FieldView label="Valid from" value={fromDisplay} />
            <FieldView label="Valid to" value={toDisplay} />
            <FieldView label="Usage limit" value={form.limit ? form.limit : 'Unlimited'} />
          </div>
          <div className="flex items-center gap-1.75 pt-1">
            <span className="h-2 w-2 rounded-full" style={{ background: form.status === 'Active' ? 'var(--color-success)' : 'var(--border-strong)' }} />
            <span className="text-sm font-medium text-ink-strong">{form.status}</span>
          </div>
        </>
      ) : (
        <>
          <Input
            label="Code"
            required
            placeholder="e.g. TEMPLE50"
            value={form.code}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange('code', e.target.value)}
            error={errors.code}
          />
          <Input
            label="Description / label"
            placeholder="e.g. Temple-desk assisted booking"
            value={form.description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange('description', e.target.value)}
          />
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex min-w-0 flex-1 basis-[200px] flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Valid from</span>
              <input
                type="datetime-local"
                value={form.from}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange('from', e.target.value)}
                className="h-9.5 rounded-md border-none bg-card px-2.75 font-sans text-base text-ink shadow-xs outline-none"
              />
            </div>
            <div className="flex min-w-0 flex-1 basis-[200px] flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Valid to</span>
              <input
                type="datetime-local"
                value={form.to}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange('to', e.target.value)}
                className="h-9.5 rounded-md border-none bg-card px-2.75 font-sans text-base text-ink shadow-xs outline-none"
              />
              {errors.dates && <span className="text-xs text-danger">End must be after start.</span>}
            </div>
            <div className="min-w-0 flex-1 basis-[140px]">
              <Input
                label="Usage limit"
                type="number"
                placeholder="Unlimited"
                value={form.limit}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange('limit', e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5 pt-1">
            <span className="text-sm font-medium text-ink">Status</span>
            <Switch checked={form.status === 'Active'} label={form.status} onChange={onStatusToggle} />
          </div>
        </>
      )}
    </div>
  )
}
