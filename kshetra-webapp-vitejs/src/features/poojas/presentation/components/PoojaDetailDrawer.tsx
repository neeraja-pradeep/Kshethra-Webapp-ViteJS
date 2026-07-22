import { useEffect, useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'
import { Badge, Icon, Input, Switch, Tabs, Tag } from '@/shared/ui'

import type { God } from '../../domain/entities/god'
import type { Pooja, PoojaSchedule, PoojaStatus } from '../../domain/entities/pooja'
import { humanDate, todayISO } from '../lib/dateUtils'
import {
  blankPoojaForm,
  formToPooja,
  poojaFormSignature,
  poojaSaveGuardMessages,
  poojaToForm,
  validatePoojaForm,
  type PoojaFormState,
} from '../lib/poojaForm'
import { recurrenceSummaryText, resolveBookable } from '../lib/scheduleLogic'
import { ConfirmModal } from './ConfirmModal'
import { DrawerHeader } from './DrawerHeader'
import { GodMultiSelect } from './GodMultiSelect'
import { ImageUploadTile } from './ImageUploadTile'
import { PastSpecificDatesModal } from './PastSpecificDatesModal'
import { ScheduleBuilder } from './ScheduleBuilder'
import { SpecificDatesEditor } from './SpecificDatesEditor'
import { UnavailableDatesEditor } from './UnavailableDatesEditor'

export interface PoojaDetailDrawerProps {
  open: boolean
  pooja: Pooja | null
  gods: readonly God[]
  /** Full catalogue (excluding this pooja) — used for the name+god clash check on save. */
  existingPoojas: readonly Pooja[]
  /** Display order pre-filled when adding a new pooja. */
  nextSortOrder: number
  onClose: () => void
  onSave: (pooja: Pooja) => void
  onDelete?: (id: string) => void
}

type ConfirmKind = 'discard' | 'delete' | 'save-guard'
type FormTab = 'media' | 'schedule'

function nextId(): string {
  return 'PJ-' + Date.now().toString(36).toUpperCase()
}

/** Controlled add/edit/view drawer for a single pooja. View-first; Edit flips to the full boxed form with media/schedule tabs. */
export function PoojaDetailDrawer({ open, pooja, gods, existingPoojas, nextSortOrder, onClose, onSave, onDelete }: PoojaDetailDrawerProps) {
  const [mode, setMode] = useState<'view' | 'edit'>(pooja ? 'view' : 'edit')
  const [form, setForm] = useState<PoojaFormState>(() => (pooja ? poojaToForm(pooja) : blankPoojaForm(nextSortOrder)))
  const [errors, setErrors] = useState<ReturnType<typeof validatePoojaForm>>({})
  const [initialSig, setInitialSig] = useState('')
  const [godPickerOpen, setGodPickerOpen] = useState(false)
  const [formTab, setFormTab] = useState<FormTab>('media')
  const [specHistoryOpen, setSpecHistoryOpen] = useState(false)
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null)
  const [saveGuardMsgs, setSaveGuardMsgs] = useState<string[]>([])

  const godNameById = (id: string) => gods.find((g) => g.id === id)?.name ?? id

  useEffect(() => {
    if (!open) return
    const initial = pooja ? poojaToForm(pooja) : blankPoojaForm(nextSortOrder)
    setForm(initial)
    setMode(pooja ? 'view' : 'edit')
    setErrors({})
    setGodPickerOpen(false)
    setFormTab('media')
    setSpecHistoryOpen(false)
    setConfirmKind(null)
    setInitialSig(poojaFormSignature(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pooja?.id])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (confirmKind) return setConfirmKind(null)
      if (specHistoryOpen) return setSpecHistoryOpen(false)
      if (godPickerOpen) return setGodPickerOpen(false)
      if (mode === 'edit') return handleCancel()
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, confirmKind, specHistoryOpen, godPickerOpen, mode, form])

  if (!open) return null

  const isView = mode === 'view' && !!pooja
  const patch = (p: Partial<PoojaFormState>) => setForm((f) => ({ ...f, ...p }))
  const patchSchedule = <K extends keyof PoojaSchedule>(key: K, value: PoojaSchedule[K]) =>
    setForm((f) => ({ ...f, schedule: { ...f.schedule, [key]: value } }))

  function handleEdit() {
    setMode('edit')
  }

  function handleCancel() {
    if (poojaFormSignature(form) !== initialSig) {
      setConfirmKind('discard')
      return
    }
    if (pooja) setMode('view')
    else onClose()
  }

  function handleDiscardConfirm() {
    const initial = pooja ? poojaToForm(pooja) : blankPoojaForm(nextSortOrder)
    setForm(initial)
    setConfirmKind(null)
    setErrors({})
    if (pooja) setMode('view')
    else onClose()
  }

  function commit(force: boolean) {
    const errs = validatePoojaForm(form, existingPoojas, pooja?.id ?? null, godNameById)
    if (Object.keys(errs).length) {
      setErrors(errs)
      setFormTab(errs.schedule || errs.specific ? 'schedule' : formTab)
      return
    }
    if (pooja && !force) {
      const msgs = poojaSaveGuardMessages(form, pooja)
      if (msgs.length) {
        setSaveGuardMsgs(msgs)
        setConfirmKind('save-guard')
        return
      }
    }
    const saved = formToPooja(form, pooja?.id ?? nextId(), godNameById)
    onSave(saved)
    if (pooja) {
      setForm(poojaToForm(saved))
      setInitialSig(poojaFormSignature(poojaToForm(saved)))
      setMode('view')
    } else {
      onClose()
    }
  }

  function handleToggleWeekday(idx: number) {
    setForm((f) => {
      const cur = f.schedule.weekdays.slice()
      const i = cur.indexOf(idx)
      if (i >= 0) cur.splice(i, 1)
      else cur.push(idx)
      cur.sort((a, b) => a - b)
      return { ...f, schedule: { ...f.schedule, weekdays: cur } }
    })
  }

  function handleAddSpecific() {
    const draft = form.specificDraft
    if (!draft) return
    if (form.specificDates.some((d) => d.date === draft)) {
      setErrors((e) => ({ ...e, specific: 'That date is already added.' }))
      return
    }
    const off = Number(form.offlinePrice) || 0
    const on = Number(form.onlinePrice) || 0
    const inc = Number(form.incentive) || 0
    const list = [...form.specificDates, { date: draft, offlinePrice: off, onlinePrice: on, incentive: inc }].sort((a, b) => a.date.localeCompare(b.date))
    patch({ specificDates: list, specificDraft: '' })
    setErrors((e) => ({ ...e, specific: undefined }))
  }

  function handleSpecificField(index: number, field: 'offlinePrice' | 'onlinePrice' | 'incentive', value: string) {
    const digits = value.replace(/[^0-9]/g, '')
    setForm((f) => {
      const list = f.specificDates.slice()
      if (!list[index]) return f
      list[index] = { ...list[index], [field]: Number(digits) || 0 }
      return { ...f, specificDates: list }
    })
  }

  function handleRemoveSpecific(index: number) {
    setForm((f) => ({ ...f, specificDates: f.specificDates.filter((_, i) => i !== index) }))
  }

  function handleAddUnavailable() {
    const start = form.unavailStart
    if (!start) return
    const end = form.unavailEnd || start
    if (end < start) {
      setErrors((e) => ({ ...e, unavail: 'End date must be on or after the start date.' }))
      return
    }
    const list = [...form.unavailable, { start, end }].sort((a, b) => a.start.localeCompare(b.start))
    patch({ unavailable: list, unavailStart: '', unavailEnd: '' })
    setErrors((e) => ({ ...e, unavail: undefined }))
  }

  function handleRemoveUnavailable(index: number) {
    setForm((f) => ({ ...f, unavailable: f.unavailable.filter((_, i) => i !== index) }))
  }

  function readImage(file: File, onDone: (dataUri: string) => void) {
    const reader = new FileReader()
    reader.onload = () => onDone(String(reader.result))
    reader.readAsDataURL(file)
  }

  const title = pooja ? (mode === 'view' ? form.name.trim() || 'Pooja details' : 'Edit pooja') : 'Add pooja'
  const saveLabel = pooja ? 'Save changes' : 'Add pooja'
  // Bookings aren't part of this feature's mock data, so the delete-guard always allows deletion.
  const deleteDisabled = false
  const deleteNote = 'No bookings reference this pooja, so it can be permanently deleted.'

  const previewDates = form.special ? resolveBookable(true, form.schedule, form.specificDates, form.unavailable, todayISO(), 6) : []
  const previewWarn = form.special && form.schedule.frequency === 'none' && form.specificDates.length === 0

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <DrawerHeader
        crumb="Poojas"
        title={title}
        isView={isView}
        saveLabel={saveLabel}
        onBack={onClose}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={() => commit(false)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-6 py-6 pb-14">
          {/* Details */}
          <div className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
            {isView ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-2xl font-semibold text-ink-strong">{form.name}</span>
                      {form.special && (
                        <Badge color="maroon" size="sm">
                          Special
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1.75 flex flex-wrap gap-1.5">
                      {form.godIds.map((id) => (
                        <Tag key={id} size="sm">
                          {godNameById(id)}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.75 text-lg font-medium text-ink-strong">
                    <span className={cn('h-2 w-2 rounded-full', form.status === 'Active' ? 'bg-success' : 'bg-stroke-strong')} />
                    {form.status}
                  </div>
                </div>
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Offline price</div>
                    <div className="mt-1 text-lg font-medium tabular-nums text-ink-strong">{formatINR(form.offlinePrice)}</div>
                  </div>
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Online price</div>
                    <div className="mt-1 text-lg font-medium tabular-nums text-ink-strong">{formatINR(form.onlinePrice)}</div>
                  </div>
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Poojari incentive</div>
                    <div className="mt-1 text-lg font-medium tabular-nums text-ink-strong">{form.incentive !== '' ? formatINR(form.incentive) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Display order</div>
                    <div className="mt-1 text-lg font-medium tabular-nums text-ink-strong">{form.sortOrder || '—'}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Details</div>
                    <div className="mt-1 text-2xs text-ink-subtle">Name, god, and pricing.</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Status</span>
                    <Switch checked={form.status === 'Active'} label={form.status} onChange={(e) => patch({ status: (e.target.checked ? 'Active' : 'Inactive') as PoojaStatus })} />
                  </div>
                </div>

                <Input label="Pooja name" required placeholder="e.g. Ganapathi Homa" value={form.name} onChange={(e) => patch({ name: e.target.value })} error={errors.name} />

                <GodMultiSelect
                  godIds={form.godIds}
                  gods={gods}
                  open={godPickerOpen}
                  error={errors.godIds}
                  onToggleOpen={() => setGodPickerOpen((o) => !o)}
                  onClose={() => setGodPickerOpen(false)}
                  onToggle={(id) =>
                    setForm((f) => {
                      const cur = f.godIds.slice()
                      const i = cur.indexOf(id)
                      if (i >= 0) cur.splice(i, 1)
                      else cur.push(id)
                      return { ...f, godIds: cur }
                    })
                  }
                  onRemove={(id) => patch({ godIds: form.godIds.filter((g) => g !== id) })}
                />

                <div className="flex flex-col gap-1.75">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1 basis-[180px]">
                      <Input label="Offline price (₹)" type="number" placeholder="0" value={form.offlinePrice} onChange={(e) => patch({ offlinePrice: e.target.value })} error={errors.offlinePrice} />
                    </div>
                    <div className="min-w-0 flex-1 basis-[180px]">
                      <Input label="Online price (₹)" type="number" placeholder="0" value={form.onlinePrice} onChange={(e) => patch({ onlinePrice: e.target.value })} error={errors.onlinePrice} />
                    </div>
                    <div className="min-w-0 flex-1 basis-[180px]">
                      <Input label="Poojari incentive (₹)" type="number" placeholder="0" value={form.incentive} onChange={(e) => patch({ incentive: e.target.value })} error={errors.incentive} />
                    </div>
                  </div>
                  <div className="text-2xs leading-snug text-ink-subtle">
                    Offline is the counter / temple rate; online is what devotees pay in the app. Incentive is the amount paid to the poojari per booking.
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-stroke-subtle pt-4">
                  <div className="w-[132px] shrink-0">
                    <Input label="Display order" type="number" placeholder="0" value={form.sortOrder} onChange={(e) => patch({ sortOrder: e.target.value })} />
                  </div>
                  <div className="min-w-0 flex-1 pt-6.5 text-2xs leading-snug text-ink-subtle">Optional — position in app lists. Lower numbers appear first.</div>
                </div>

                {pooja && (
                  <div className="mt-1 flex flex-wrap items-center gap-3.5 rounded-lg bg-card p-4 shadow-[inset_0_0_0_1px_var(--color-danger-border)]">
                    <div className="min-w-[180px] flex-1">
                      <div className="text-sm font-semibold text-ink-strong">Delete pooja</div>
                      <div className="mt-0.5 text-xs leading-snug text-ink-subtle">{deleteNote}</div>
                    </div>
                    <button
                      type="button"
                      disabled={deleteDisabled}
                      onClick={() => setConfirmKind('delete')}
                      className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-danger-border bg-transparent px-3.5 text-sm font-medium text-danger-strong disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Unavailable dates */}
          <UnavailableDatesEditor
            ranges={form.unavailable}
            start={form.unavailStart}
            end={form.unavailEnd}
            editing={!isView}
            error={errors.unavail}
            onStartChange={(v) => patch({ unavailStart: v })}
            onEndChange={(v) => patch({ unavailEnd: v })}
            onAdd={handleAddUnavailable}
            onRemove={handleRemoveUnavailable}
          />

          {/* Special pooja */}
          {(!isView || form.special) && (
            <div className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
              {!isView && (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Special pooja</div>
                    <div className="mt-1 text-2xs text-ink-subtle">Adds app card, banner, and scheduling.</div>
                  </div>
                  <Switch checked={form.special} onChange={(e) => patch({ special: e.target.checked })} />
                </div>
              )}

              {form.special && (
                <div className="flex flex-col gap-4">
                  {!isView && (
                    <Tabs
                      variant="pill"
                      size="sm"
                      items={[
                        { id: 'media', label: 'Media', icon: <Icon name="image" size={15} /> },
                        { id: 'schedule', label: 'Schedule', icon: <Icon name="calendar-dots" size={15} /> },
                      ]}
                      value={formTab}
                      onChange={(id) => setFormTab(id as FormTab)}
                    />
                  )}

                  {(isView || formTab === 'media') && (isView ? form.cardImage || form.bannerImage || form.cardDesc || form.bannerDesc : true) && (
                    <div className="flex flex-wrap items-start gap-3.5">
                      <div className="flex min-w-0 flex-1 basis-60 flex-col gap-2.5">
                        {(!isView || form.cardImage) && (
                          <div className="flex flex-col gap-1.75">
                            {!isView && <div className="text-sm font-medium text-ink">Card image</div>}
                            <ImageUploadTile
                              image={form.cardImage}
                              editing={!isView}
                              boxClassName="w-full h-[130px]"
                              uploadLabel="Upload card image"
                              removeLabel="Remove card image"
                              onUpload={(file) => readImage(file, (uri) => patch({ cardImage: uri }))}
                              onRemove={() => patch({ cardImage: null })}
                            />
                          </div>
                        )}
                        {(!isView || form.cardDesc) && (
                          <>
                            {!isView ? (
                              <Input label="Card description" placeholder="Short text shown on the app card." value={form.cardDesc} onChange={(e) => patch({ cardDesc: e.target.value })} />
                            ) : (
                              form.cardDesc && (
                                <div>
                                  <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Card description</div>
                                  <div className="mt-1 text-sm text-ink">{form.cardDesc}</div>
                                </div>
                              )
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 basis-60 flex-col gap-2.5">
                        {(!isView || form.bannerImage) && (
                          <div className="flex flex-col gap-1.75">
                            {!isView && <div className="text-sm font-medium text-ink">Banner image</div>}
                            <ImageUploadTile
                              image={form.bannerImage}
                              editing={!isView}
                              boxClassName="w-full h-[110px]"
                              uploadLabel="Upload banner image"
                              removeLabel="Remove banner image"
                              onUpload={(file) => readImage(file, (uri) => patch({ bannerImage: uri }))}
                              onRemove={() => patch({ bannerImage: null })}
                            />
                          </div>
                        )}
                        {(!isView || form.bannerDesc) && (
                          <>
                            {!isView ? (
                              <Input label="Banner description" placeholder="Text shown on the banner." value={form.bannerDesc} onChange={(e) => patch({ bannerDesc: e.target.value })} />
                            ) : (
                              form.bannerDesc && (
                                <div>
                                  <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Banner description</div>
                                  <div className="mt-1 text-sm text-ink">{form.bannerDesc}</div>
                                </div>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {(isView || formTab === 'schedule') && (
                    <div className="flex flex-col gap-4.5">
                      <div className="flex flex-col gap-1.75">
                        <div>
                          <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Recurring availability</div>
                          <div className="mt-1 text-2xs leading-snug text-ink-subtle">The repeating pattern this pooja is offered on. Occurrences use the base price.</div>
                        </div>
                        {isView ? (
                          <div className="text-lg font-medium leading-snug text-ink-strong">{recurrenceSummaryText(form.schedule)}</div>
                        ) : (
                          <ScheduleBuilder schedule={form.schedule} error={errors.schedule} onChange={patchSchedule} onToggleWeekday={handleToggleWeekday} />
                        )}
                      </div>

                      <div className="h-px bg-stroke-subtle" />

                      <SpecificDatesEditor
                        dates={form.specificDates}
                        draft={form.specificDraft}
                        editing={!isView}
                        onDraftChange={(v) => patch({ specificDraft: v })}
                        onAdd={handleAddSpecific}
                        onRemove={handleRemoveSpecific}
                        onFieldChange={handleSpecificField}
                        onOpenHistory={() => setSpecHistoryOpen(true)}
                      />

                      <div className={cn('flex flex-col gap-2.25 rounded-lg border px-3.5 py-3', previewWarn ? 'border-warning-border bg-warning-surface' : 'border-stroke-subtle bg-sunken')}>
                        <div className="flex items-center gap-1.75 text-sm font-medium text-ink">
                          <Icon name={previewWarn ? 'warning' : 'calendar-check'} weight={previewWarn ? 'fill' : 'regular'} size={15} className={previewWarn ? 'text-warning' : 'text-primary'} />
                          Next bookable dates
                        </div>
                        {previewDates.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {previewDates.map((iso) => (
                              <span key={iso} className="whitespace-nowrap rounded-full border border-stroke-subtle bg-card px-2.75 py-1 text-xs text-ink">
                                {humanDate(iso)}
                              </span>
                            ))}
                          </div>
                        )}
                        {previewDates.length === 0 && (
                          <div className="text-xs text-ink">
                            {previewWarn ? 'No bookable dates yet — add a recurrence or specific date.' : 'No upcoming bookable dates with the current settings.'}
                          </div>
                        )}
                        <div className="text-2xs text-ink-subtle">(Recurring ∪ specific) − unavailable. Unavailable always wins.</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PastSpecificDatesModal open={specHistoryOpen} dates={form.specificDates} onClose={() => setSpecHistoryOpen(false)} />

      <ConfirmModal
        open={confirmKind === 'discard'}
        title="Discard changes?"
        body="Your unsaved changes will be lost."
        actionLabel="Discard"
        onConfirm={handleDiscardConfirm}
        onCancel={() => setConfirmKind(null)}
      />
      <ConfirmModal
        open={confirmKind === 'save-guard'}
        title="Apply changes to future bookings?"
        body={saveGuardMsgs.join(' ')}
        actionLabel="Save changes"
        onConfirm={() => {
          setConfirmKind(null)
          commit(true)
        }}
        onCancel={() => setConfirmKind(null)}
      />
      <ConfirmModal
        open={confirmKind === 'delete'}
        title="Delete pooja?"
        body={`"${pooja?.name ?? ''}" will be permanently removed — allowed because no bookings or orders reference it. This can’t be undone.`}
        actionLabel="Delete"
        onConfirm={() => {
          if (pooja) onDelete?.(pooja.id)
          setConfirmKind(null)
          onClose()
        }}
        onCancel={() => setConfirmKind(null)}
      />
    </div>
  )
}
