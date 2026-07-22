import { useEffect, useState } from 'react'

import { Input, Switch } from '@/shared/ui'

import type { God, GodStatus } from '../../domain/entities/god'
import {
  blankGodForm,
  formToGod,
  godFormSignature,
  godSaveGuardMessage,
  godToForm,
  validateGodForm,
  type GodFormState,
} from '../lib/godForm'
import { ConfirmModal } from './ConfirmModal'
import { DrawerHeader } from './DrawerHeader'
import { ImageUploadTile } from './ImageUploadTile'

export interface GodDetailDrawerProps {
  open: boolean
  god: God | null
  /** Number of poojas currently referencing this god — drives the delete-guard note. */
  poojaCount: number
  /** Display order pre-filled when adding a new god. */
  nextSortOrder: number
  onClose: () => void
  onSave: (god: God) => void
  onDelete?: (id: string) => void
}

type ConfirmKind = 'discard' | 'delete' | 'save-guard'

function nextId(): string {
  return 'GOD-' + Date.now().toString(36).toUpperCase()
}

/** View-first god detail drawer; Edit flips to the full boxed form. */
export function GodDetailDrawer({ open, god, poojaCount, nextSortOrder, onClose, onSave, onDelete }: GodDetailDrawerProps) {
  const [mode, setMode] = useState<'view' | 'edit'>(god ? 'view' : 'edit')
  const [form, setForm] = useState<GodFormState>(() => (god ? godToForm(god) : blankGodForm(nextSortOrder)))
  const [errors, setErrors] = useState<{ name?: string }>({})
  const [initialSig, setInitialSig] = useState('')
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null)
  const [saveGuardMsg, setSaveGuardMsg] = useState('')

  useEffect(() => {
    if (!open) return
    const initial = god ? godToForm(god) : blankGodForm(nextSortOrder)
    setForm(initial)
    setMode(god ? 'view' : 'edit')
    setErrors({})
    setConfirmKind(null)
    setInitialSig(godFormSignature(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, god?.id])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (confirmKind) return setConfirmKind(null)
      if (mode === 'edit') return handleCancel()
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, confirmKind, mode, form])

  if (!open) return null

  const isView = mode === 'view' && !!god
  const patch = (p: Partial<GodFormState>) => setForm((f) => ({ ...f, ...p }))

  function handleEdit() {
    setMode('edit')
  }

  function handleCancel() {
    if (godFormSignature(form) !== initialSig) {
      setConfirmKind('discard')
      return
    }
    if (god) setMode('view')
    else onClose()
  }

  function handleDiscardConfirm() {
    const initial = god ? godToForm(god) : blankGodForm(nextSortOrder)
    setForm(initial)
    setConfirmKind(null)
    if (god) setMode('view')
    else onClose()
  }

  function commit(force: boolean) {
    const errs = validateGodForm(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    if (god && !force) {
      const msg = godSaveGuardMessage(form, god)
      if (msg) {
        setSaveGuardMsg(msg)
        setConfirmKind('save-guard')
        return
      }
    }
    const saved = formToGod(form, god?.id ?? nextId())
    onSave(saved)
    if (god) {
      setForm(godToForm(saved))
      setInitialSig(godFormSignature(godToForm(saved)))
      setMode('view')
    } else {
      onClose()
    }
  }

  function handleDelete() {
    if (!god) return
    setConfirmKind('delete')
  }

  const title = god ? (mode === 'view' ? form.name.trim() || 'God details' : 'Edit god') : 'Add god'
  const saveLabel = god ? 'Save changes' : 'Add god'
  const deleteDisabled = poojaCount > 0
  const deleteNote =
    poojaCount > 0
      ? `Can’t delete — ${poojaCount} pooja${poojaCount === 1 ? '' : 's'} use this god. Deactivate instead to preserve history.`
      : 'No poojas use this god, so it can be permanently deleted.'

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <DrawerHeader
        crumb="Gods"
        title={title}
        isView={isView}
        saveLabel={saveLabel}
        onBack={onClose}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={() => commit(false)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[880px] px-6 py-6.5">
          <div className="flex flex-col gap-4.5 rounded-2xl bg-card p-6 shadow-sm">
            {isView ? (
              <>
                <div>
                  <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Name</div>
                  <div className="mt-1 text-2xl font-semibold text-ink-strong">{form.name}</div>
                </div>
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Status</div>
                    <div className="mt-1 flex items-center gap-1.75 text-lg font-medium text-ink-strong">
                      <span className={`h-2 w-2 rounded-full ${form.status === 'Active' ? 'bg-success' : 'bg-stroke-strong'}`} />
                      {form.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Sort order</div>
                    <div className="mt-1 text-lg font-medium text-ink-strong">{form.sortOrder || '—'}</div>
                  </div>
                  <div>
                    <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Poojas</div>
                    <div className="mt-1 text-lg font-medium text-ink-strong">{poojaCount}</div>
                  </div>
                </div>
                {(form.homeImage || form.poojaImage) && (
                  <div className="flex flex-wrap gap-5">
                    {form.homeImage && (
                      <div className="flex flex-col gap-1.75">
                        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Home screen image</div>
                        <ImageUploadTile
                          image={form.homeImage}
                          editing={false}
                          boxClassName="w-[180px] aspect-[3/4]"
                          uploadLabel=""
                          removeLabel=""
                          onUpload={() => {}}
                          onRemove={() => {}}
                        />
                      </div>
                    )}
                    {form.poojaImage && (
                      <div className="flex flex-col gap-1.75">
                        <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Pooja image</div>
                        <ImageUploadTile
                          image={form.poojaImage}
                          editing={false}
                          boxClassName="w-[260px] aspect-[4/3]"
                          uploadLabel=""
                          removeLabel=""
                          onUpload={() => {}}
                          onRemove={() => {}}
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <Input label="Name" required placeholder="e.g. Ganesha" value={form.name} onChange={(e) => patch({ name: e.target.value })} error={errors.name} />

                <div className="flex flex-col gap-1.75">
                  <div className="text-sm font-medium text-ink">Home screen image</div>
                  <ImageUploadTile
                    image={form.homeImage}
                    editing
                    boxClassName="w-[180px] aspect-[3/4]"
                    uploadLabel="Upload home screen image"
                    removeLabel="Remove home screen image"
                    hint="PNG or JPG, up to 5 MB"
                    onUpload={(file) => {
                      const reader = new FileReader()
                      reader.onload = () => patch({ homeImage: String(reader.result) })
                      reader.readAsDataURL(file)
                    }}
                    onRemove={() => patch({ homeImage: null })}
                  />
                </div>

                <div className="flex flex-col gap-1.75">
                  <div className="text-sm font-medium text-ink">Pooja image</div>
                  <ImageUploadTile
                    image={form.poojaImage}
                    editing
                    boxClassName="w-[260px] aspect-[4/3]"
                    uploadLabel="Upload pooja image"
                    removeLabel="Remove pooja image"
                    hint="PNG or JPG, up to 5 MB"
                    onUpload={(file) => {
                      const reader = new FileReader()
                      reader.onload = () => patch({ poojaImage: String(reader.result) })
                      reader.readAsDataURL(file)
                    }}
                    onRemove={() => patch({ poojaImage: null })}
                  />
                </div>

                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Input label="Display order" type="number" placeholder="0" value={form.sortOrder} onChange={(e) => patch({ sortOrder: e.target.value })} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2.25 text-sm font-medium text-ink">Status</div>
                    <div className="flex h-8 items-center">
                      <Switch
                        checked={form.status === 'Active'}
                        label={form.status}
                        onChange={(e) => patch({ status: (e.target.checked ? 'Active' : 'Inactive') as GodStatus })}
                      />
                    </div>
                  </div>
                </div>

                {god && (
                  <div className="mt-1 flex flex-wrap items-center gap-3.5 rounded-lg bg-card p-4 shadow-[inset_0_0_0_1px_var(--color-danger-border)]">
                    <div className="min-w-[180px] flex-1">
                      <div className="text-sm font-semibold text-ink-strong">Delete god</div>
                      <div className="mt-0.5 text-xs leading-snug text-ink-subtle">{deleteNote}</div>
                    </div>
                    <button
                      type="button"
                      disabled={deleteDisabled}
                      onClick={handleDelete}
                      className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-danger-border bg-transparent px-3.5 text-sm font-medium text-danger-strong disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
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
        title="Deactivate this god?"
        body={saveGuardMsg}
        actionLabel="Save changes"
        onConfirm={() => {
          setConfirmKind(null)
          commit(true)
        }}
        onCancel={() => setConfirmKind(null)}
      />
      <ConfirmModal
        open={confirmKind === 'delete'}
        title="Delete god?"
        body={`"${god?.name ?? ''}" will be permanently removed — allowed because no poojas reference it. This can’t be undone.`}
        actionLabel="Delete"
        onConfirm={() => {
          if (god) onDelete?.(god.id)
          setConfirmKind(null)
          onClose()
        }}
        onCancel={() => setConfirmKind(null)}
      />
    </div>
  )
}
