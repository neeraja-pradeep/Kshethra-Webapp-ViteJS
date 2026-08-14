import { useEffect, useMemo, useState } from 'react'

import { toFailure, toFieldErrors } from '@/core/error/result'
import { useObjectUrl } from '@/shared/hooks/useObjectUrl'
import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'
import { Alert, Badge, Icon, Input, Spinner, Switch, Tabs, Tag, Textarea } from '@/shared/ui'

import { usePoojaAvailabilityQuery } from '@/features/poojas/application/queries/usePoojasQuery'
import type { God } from '@/features/poojas/domain/entities/god'
import type { Pooja, PoojaStatus } from '@/features/poojas/domain/entities/pooja'
import type { PoojaWrite } from '@/features/poojas/domain/repositories/pooja.repository'
import {
  blankPoojaForm,
  poojaFormSignature,
  poojaSaveGuardMessages,
  poojaToForm,
  shownImage,
  toPoojaWrite,
  validatePoojaForm,
  type PoojaFormState,
  type SpecialDateDraft,
} from '@/features/poojas/presentation/lib/poojaForm'

import { ConfirmModal } from './ConfirmModal'
import { DrawerHeader } from './DrawerHeader'
import { GodMultiSelect } from './GodMultiSelect'
import { ImageUploadTile } from './ImageUploadTile'
import { SpecificDatesEditor } from './SpecificDatesEditor'
import { UnavailableDatesEditor } from './UnavailableDatesEditor'
import { addDaysISO, humanDate, todayISO } from '../lib/dateUtils'

export interface PoojaDetailDrawerProps {
  open: boolean
  pooja: Pooja | null
  gods: readonly God[]
  /** Display order pre-filled when adding, taken from the list summary. */
  nextSortOrder: number
  saving: boolean
  /**
   * Bumped by the screen on every successful edit. Editing returns to the view
   * pane rather than closing, so the operator can see what they just saved.
   */
  savedNonce: number
  deleting: boolean
  saveError: unknown
  deleteError: unknown
  onClose: () => void
  onSave: (input: PoojaWrite) => void
  onDelete?: (id: number) => void
}

type ConfirmKind = 'discard' | 'delete' | 'save-guard'
type FormTab = 'media' | 'schedule'

/** How far ahead the bookable-date preview looks. */
const AVAILABILITY_WINDOW_DAYS = 90
const PREVIEW_DATE_COUNT = 8

const TABS = [
  { id: 'media', label: 'Media & copy' },
  { id: 'schedule', label: 'Schedule' },
]

/** Controlled add/edit/view drawer for a single pooja. View-first; Edit flips to the full form. */
export function PoojaDetailDrawer({
  open,
  pooja,
  gods,
  nextSortOrder,
  saving,
  savedNonce,
  deleting,
  saveError,
  deleteError,
  onClose,
  onSave,
  onDelete,
}: PoojaDetailDrawerProps) {
  const [mode, setMode] = useState<'view' | 'edit'>(pooja ? 'view' : 'edit')
  const [form, setForm] = useState<PoojaFormState>(() =>
    pooja ? poojaToForm(pooja) : blankPoojaForm(nextSortOrder),
  )
  const [errors, setErrors] = useState<ReturnType<typeof validatePoojaForm>>({})
  const [initialSig, setInitialSig] = useState('')
  const [godPickerOpen, setGodPickerOpen] = useState(false)
  const [formTab, setFormTab] = useState<FormTab>('media')
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null)
  const [saveGuardMsgs, setSaveGuardMsgs] = useState<string[]>([])

  const mediaPreview = useObjectUrl(form.media)
  const bannerPreview = useObjectUrl(form.banner)

  const fieldErrors = toFieldErrors(saveError)
  const failure = toFailure(saveError) ?? toFailure(deleteError)

  const start = todayISO()
  const end = useMemo(() => addDaysISO(start, AVAILABILITY_WINDOW_DAYS), [start])

  /**
   * The calendar comes from the server, not from re-deriving it here: it is the
   * only thing that knows about a block another admin added a minute ago. It
   * asks for `view_pooja`, unlike the blocks sub-resource, so it is safe on a
   * read-only view — but it only exists for a saved pooja.
   */
  const availability = usePoojaAvailabilityQuery(
    pooja?.id ?? null,
    start,
    end,
    open && pooja != null,
  )

  useEffect(() => {
    if (!open) return
    const initial = pooja ? poojaToForm(pooja) : blankPoojaForm(nextSortOrder)
    setForm(initial)
    setMode(pooja ? 'view' : 'edit')
    setErrors({})
    setGodPickerOpen(false)
    setFormTab('media')
    setConfirmKind(null)
    setInitialSig(poojaFormSignature(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pooja?.id])

  // A saved edit drops back to the view pane; a saved *new* pooja closes the
  // drawer, which the screen does instead.
  useEffect(() => {
    if (savedNonce > 0) setMode('view')
  }, [savedNonce])

  // Re-seed from the server's copy once the refetch lands, but only while
  // viewing — clobbering a form someone is typing into would be worse than
  // showing them a value one refetch behind.
  useEffect(() => {
    if (!open || !pooja || mode !== 'view') return
    const next = poojaToForm(pooja)
    setForm(next)
    setInitialSig(poojaFormSignature(next))
  }, [pooja, open, mode])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (confirmKind) return setConfirmKind(null)
      if (godPickerOpen) return setGodPickerOpen(false)
      if (mode === 'edit') return handleCancel()
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, confirmKind, godPickerOpen, mode, form])

  if (!open) return null

  const isView = mode === 'view' && !!pooja
  const busy = saving || deleting
  const patch = (p: Partial<PoojaFormState>) => setForm((f) => ({ ...f, ...p }))
  const godNameById = (id: number) => gods.find((g) => g.id === id)?.name ?? String(id)

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
    setErrors({})
    setConfirmKind(null)
    if (pooja) setMode('view')
    else onClose()
  }

  function commit(force: boolean) {
    const errs = validatePoojaForm(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      setFormTab(errs.specific || errs.block ? 'schedule' : 'media')
      return
    }
    if (pooja && !force) {
      const messages = poojaSaveGuardMessages(form, pooja)
      if (messages.length) {
        setSaveGuardMsgs(messages)
        setConfirmKind('save-guard')
        return
      }
    }
    onSave(toPoojaWrite(form))
  }

  function addSpecialDate() {
    const date = form.specificDraft
    if (!date) return
    if (form.specialDates.some((d) => d.date === date)) return
    const next: SpecialDateDraft = {
      id: null,
      date,
      time: '',
      offlinePrice: '',
      onlinePrice: '',
      banner: false,
    }
    patch({
      specialDates: [...form.specialDates, next].sort((a, b) => a.date.localeCompare(b.date)),
      specificDraft: '',
    })
  }

  function addBlock() {
    if (!form.blockStart) return
    patch({
      blocks: [
        ...form.blocks,
        {
          id: null,
          startDate: form.blockStart,
          endDate: form.blockEnd || form.blockStart,
          reason: form.blockReason,
        },
      ],
      blockStart: '',
      blockEnd: '',
      blockReason: '',
    })
  }

  const title = pooja
    ? mode === 'view'
      ? form.name.trim() || 'Pooja details'
      : 'Edit pooja'
    : 'Add pooja'
  const saveLabel = pooja ? 'Save changes' : 'Add pooja'
  const mediaShown = shownImage(form.media, form.mediaUrl, mediaPreview)
  const bannerShown = shownImage(form.banner, form.bannerUrl, bannerPreview)

  const bookable = availability.data?.bookableDates ?? null

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <DrawerHeader
        crumb="Poojas"
        title={title}
        isView={isView}
        saveLabel={saving ? 'Saving…' : saveLabel}
        busy={busy}
        onBack={onClose}
        onEdit={() => setMode('edit')}
        onCancel={handleCancel}
        onSave={() => commit(false)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[880px] flex-col gap-4 px-6 py-6.5">
          {failure && <Alert type="danger">{failure.message}</Alert>}

          <div className="flex flex-col gap-4.5 rounded-2xl bg-card p-6 shadow-sm">
            {isView ? (
              <>
                <div>
                  <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                    Pooja
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-2xl font-semibold text-ink-strong">
                    {form.name}
                    {form.special && (
                      <Badge color="maroon" size="sm">
                        Special
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {form.godIds.map((id) => (
                      <Tag key={id}>{godNameById(id)}</Tag>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                      Offline price
                    </div>
                    <div className="mt-1 text-lg font-medium tabular-nums text-ink-strong">
                      {formatINR(Number(form.offlinePrice))}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                      Online price
                    </div>
                    <div className="mt-1 text-lg font-medium tabular-nums text-ink-strong">
                      {formatINR(Number(form.onlinePrice))}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                      Poojari incentive
                    </div>
                    <div className="mt-1 text-lg font-medium tabular-nums text-ink-strong">
                      {form.incentive ? formatINR(Number(form.incentive)) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                      Status
                    </div>
                    <div className="mt-1 flex items-center gap-1.75 text-lg font-medium text-ink-strong">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          form.status === 'Active' ? 'bg-success' : 'bg-stroke-strong',
                        )}
                      />
                      {form.status}
                    </div>
                  </div>
                </div>
                {(mediaShown || bannerShown) && (
                  <div className="flex flex-wrap gap-5">
                    {mediaShown && (
                      <ImageUploadTile
                        image={mediaShown}
                        editing={false}
                        boxClassName="w-[240px] aspect-[4/3]"
                        uploadLabel=""
                        removeLabel=""
                        onUpload={() => {}}
                        onRemove={() => {}}
                      />
                    )}
                    {bannerShown && (
                      <ImageUploadTile
                        image={bannerShown}
                        editing={false}
                        boxClassName="w-[320px] aspect-[16/9]"
                        uploadLabel=""
                        removeLabel=""
                        onUpload={() => {}}
                        onRemove={() => {}}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <Input
                  label="Pooja name"
                  required
                  placeholder="e.g. Ganapathi Homa"
                  value={form.name}
                  disabled={busy}
                  onChange={(e) => patch({ name: e.target.value })}
                  error={errors.name ?? fieldErrors.name?.[0]}
                />

                <GodMultiSelect
                  godIds={form.godIds}
                  gods={gods}
                  open={godPickerOpen}
                  error={errors.godIds ?? fieldErrors.god_ids?.[0]}
                  onToggleOpen={() => setGodPickerOpen((v) => !v)}
                  onClose={() => setGodPickerOpen(false)}
                  onToggle={(id) =>
                    patch({
                      godIds: form.godIds.includes(id)
                        ? form.godIds.filter((g) => g !== id)
                        : [...form.godIds, id],
                    })
                  }
                  onRemove={(id) => patch({ godIds: form.godIds.filter((g) => g !== id) })}
                />
                {form.godIds.length > 1 && (
                  <div className="-mt-2 text-2xs text-ink-subtle">
                    <strong className="font-semibold">
                      {godNameById(form.godIds[0] as number)}
                    </strong>{' '}
                    is the primary god — it is the one shown under the pooja’s name.
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <div className="min-w-[140px] flex-1">
                    <Input
                      label="Offline price"
                      type="number"
                      min={0}
                      required
                      value={form.offlinePrice}
                      disabled={busy}
                      onChange={(e) => patch({ offlinePrice: e.target.value })}
                      error={errors.offlinePrice ?? fieldErrors.offline_price?.[0]}
                    />
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <Input
                      label="Online price"
                      type="number"
                      min={0}
                      required
                      value={form.onlinePrice}
                      disabled={busy}
                      onChange={(e) => patch({ onlinePrice: e.target.value })}
                      error={errors.onlinePrice ?? fieldErrors.online_price?.[0]}
                    />
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <Input
                      label="Poojari incentive"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={form.incentive}
                      disabled={busy}
                      onChange={(e) => patch({ incentive: e.target.value })}
                      error={errors.incentive ?? fieldErrors.poojari_incentive?.[0]}
                    />
                  </div>
                </div>
                <div className="-mt-2.5 text-2xs leading-snug text-ink-subtle">
                  The incentive is what the poojari is paid per booking. It is never charged to the
                  devotee and never enters an order total. Leave it blank for none.
                </div>

                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[140px] flex-1">
                    <Input
                      label="Display order"
                      type="number"
                      placeholder="0"
                      value={form.sortOrder}
                      disabled={busy}
                      onChange={(e) => patch({ sortOrder: e.target.value })}
                      error={fieldErrors.sort_order?.[0]}
                    />
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <div className="mb-2.25 text-sm font-medium text-ink">Status</div>
                    <div className="flex h-8 items-center">
                      <Switch
                        checked={form.status === 'Active'}
                        label={form.status}
                        disabled={busy}
                        onChange={(e) =>
                          patch({
                            status: (e.target.checked ? 'Active' : 'Inactive') as PoojaStatus,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <div className="mb-2.25 text-sm font-medium text-ink">Special pooja</div>
                    <div className="flex h-8 items-center">
                      <Switch
                        checked={form.special}
                        label={form.special ? 'Special' : 'Standard'}
                        disabled={busy}
                        onChange={(e) => patch({ special: e.target.checked })}
                      />
                    </div>
                  </div>
                </div>
                {form.special && (
                  <div className="-mt-2.5 text-2xs leading-snug text-ink-subtle">
                    A special pooja may only be booked on a published date.
                  </div>
                )}
              </>
            )}
          </div>

          {!isView && (
            <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm">
              <Tabs items={TABS} value={formTab} onChange={(id) => setFormTab(id as FormTab)} />

              {formTab === 'media' ? (
                <div className="flex flex-col gap-4.5">
                  <div className="flex flex-col gap-1.75">
                    <div className="text-sm font-medium text-ink">Pooja image</div>
                    <ImageUploadTile
                      image={mediaShown}
                      editing
                      boxClassName="w-[240px] aspect-[4/3]"
                      uploadLabel="Upload pooja image"
                      removeLabel="Remove pooja image"
                      hint="PNG or JPG, up to 5 MB"
                      onUpload={(file) => patch({ media: file })}
                      onRemove={() => patch({ media: null })}
                    />
                    {fieldErrors.media?.[0] && (
                      <div className="text-xs text-danger">{fieldErrors.media[0]}</div>
                    )}
                  </div>

                  {form.special ? (
                    <>
                      <Textarea
                        label="Card description"
                        rows={2}
                        value={form.cardDesc}
                        onChange={(e) => patch({ cardDesc: e.target.value })}
                      />
                      <div className="flex flex-col gap-1.75">
                        <div className="text-sm font-medium text-ink">Banner image</div>
                        <ImageUploadTile
                          image={bannerShown}
                          editing
                          boxClassName="w-[320px] aspect-[16/9]"
                          uploadLabel="Upload banner image"
                          removeLabel="Remove banner image"
                          hint="PNG or JPG, up to 5 MB"
                          onUpload={(file) => patch({ banner: file })}
                          onRemove={() => patch({ banner: null })}
                        />
                        {fieldErrors.banner?.[0] && (
                          <div className="text-xs text-danger">{fieldErrors.banner[0]}</div>
                        )}
                      </div>
                      <Textarea
                        label="Banner description"
                        rows={2}
                        value={form.bannerDesc}
                        onChange={(e) => patch({ bannerDesc: e.target.value })}
                      />
                      <Textarea
                        label="Captions"
                        rows={2}
                        value={form.captionsDesc}
                        onChange={(e) => patch({ captionsDesc: e.target.value })}
                      />
                    </>
                  ) : (
                    <div className="text-2xs leading-snug text-ink-subtle">
                      The card, banner and their copy belong to special poojas. Turn on{' '}
                      <em>Special pooja</em> above to set them.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4.5">
                  {form.special ? (
                    <SpecificDatesEditor
                      dates={form.specialDates}
                      draft={form.specificDraft}
                      editing
                      error={errors.specific}
                      onDraftChange={(value) => patch({ specificDraft: value })}
                      onAdd={addSpecialDate}
                      onRemove={(index) =>
                        patch({ specialDates: form.specialDates.filter((_, i) => i !== index) })
                      }
                      onFieldChange={(index, fieldPatch) =>
                        patch({
                          specialDates: form.specialDates.map((d, i) =>
                            i === index ? { ...d, ...fieldPatch } : d,
                          ),
                        })
                      }
                    />
                  ) : (
                    <div className="text-2xs leading-snug text-ink-subtle">
                      A standard pooja is bookable on any day the temple has not blocked, so it has
                      no published dates.
                    </div>
                  )}

                  {/* A published date that a save also blocks is refused, so the
                      block card sits alongside the dates rather than elsewhere. */}
                  <UnavailableDatesEditor
                    blocks={form.blocks}
                    start={form.blockStart}
                    end={form.blockEnd}
                    reason={form.blockReason}
                    editing
                    error={errors.block}
                    onStartChange={(value) => patch({ blockStart: value })}
                    onEndChange={(value) => patch({ blockEnd: value })}
                    onReasonChange={(value) => patch({ blockReason: value })}
                    onAdd={addBlock}
                    onRemove={(index) =>
                      patch({ blocks: form.blocks.filter((_, i) => i !== index) })
                    }
                  />
                </div>
              )}
            </div>
          )}

          {isView && (
            <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm">
              <div>
                <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                  Booking calendar
                </div>
                <div className="mt-1 text-2xs leading-snug text-ink-subtle">
                  The next {AVAILABILITY_WINDOW_DAYS} days, as the server sees them.
                </div>
              </div>

              {availability.isPending ? (
                <div className="flex items-center gap-2 text-sm text-ink-subtle">
                  <Spinner size={16} /> Loading the calendar…
                </div>
              ) : availability.isError ? (
                <Alert type="warning">
                  {toFailure(availability.error)?.message ?? 'The calendar is unavailable.'}
                </Alert>
              ) : (
                <>
                  <div>
                    <div className="text-xs font-medium text-ink">Bookable</div>
                    {bookable === null ? (
                      <div className="mt-1 text-sm text-ink-muted">
                        Any day that is not blocked — this is a standard pooja.
                      </div>
                    ) : bookable.length === 0 ? (
                      <div className="mt-1 text-sm text-ink-muted">
                        No upcoming dates. A special pooja cannot be booked until a date is
                        published.
                      </div>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {bookable.slice(0, PREVIEW_DATE_COUNT).map((date) => (
                          <Tag key={date}>{humanDate(date)}</Tag>
                        ))}
                        {bookable.length > PREVIEW_DATE_COUNT && (
                          <span className="self-center text-2xs text-ink-subtle">
                            +{bookable.length - PREVIEW_DATE_COUNT} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {form.blocks.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-ink">Blocked</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {form.blocks.map((block, index) => (
                          <span
                            key={block.id ?? `new-${index}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-danger-surface px-2.5 py-1 text-xs font-medium text-ink"
                          >
                            <Icon name="prohibit" size={12} className="text-danger" />
                            {block.endDate && block.endDate !== block.startDate
                              ? `${humanDate(block.startDate)} → ${humanDate(block.endDate)}`
                              : humanDate(block.startDate)}
                            {block.reason && (
                              <span className="text-ink-subtle">· {block.reason}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!isView && pooja && (
            <div className="flex flex-wrap items-center gap-3.5 rounded-2xl bg-card p-5 shadow-[inset_0_0_0_1px_var(--color-danger-border)]">
              <div className="min-w-[180px] flex-1">
                <div className="text-sm font-semibold text-ink-strong">Delete pooja</div>
                <div className="mt-0.5 text-xs leading-snug text-ink-subtle">
                  A pooja that has ever been booked cannot be deleted — it is part of the record of
                  what the temple was paid for. Deactivate it instead.
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmKind('delete')}
                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-danger-border bg-transparent px-3.5 text-sm font-medium text-danger-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? <Spinner size={14} /> : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>

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
        body={`"${pooja?.name ?? ''}" will be permanently removed, along with its images and published dates. This can’t be undone.`}
        actionLabel="Delete"
        onConfirm={() => {
          if (pooja) onDelete?.(pooja.id)
          setConfirmKind(null)
        }}
        onCancel={() => setConfirmKind(null)}
      />
    </div>
  )
}
