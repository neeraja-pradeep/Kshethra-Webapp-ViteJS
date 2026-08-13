import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'

import { cn } from '@/shared/lib/cn'
import { Alert, Button, Icon, Input, Switch } from '@/shared/ui'

import { categoryStatusLabel, type Category, type CategoryStatus } from '@/features/store/domain/entities/category'

import { ConfirmDialog } from './ConfirmDialog'
import { DetailTopBar } from './DetailTopBar'
import { ViewField } from './OverlineField'

export interface CategoryFormValues {
  name: string
  status: CategoryStatus
  skuPrefix: string
  /** A newly picked file, or `null` to clear the picture. `undefined` = unchanged. */
  media?: File | null
}

function blankForm(): CategoryFormValues {
  return { name: '', status: 'active', skuPrefix: '' }
}
function fromCategory(c: Category): CategoryFormValues {
  return { name: c.name, status: c.status, skuPrefix: c.skuPrefix }
}
function signature(f: CategoryFormValues): string {
  return JSON.stringify([f.name, f.status, f.skuPrefix, f.media === undefined ? 'keep' : f.media?.name ?? 'clear'])
}

export interface CategoryDetailFormProps {
  category: Category | null
  mode: 'view' | 'edit'
  saving: boolean
  /** Server-side field errors, keyed as the API names them. */
  fieldErrors: Record<string, readonly string[]>
  errorMessage: string | null
  canEdit: boolean
  canDelete: boolean
  onStartEdit: () => void
  onCancel: () => void
  onSave: (values: CategoryFormValues) => void
  onDeactivate: () => void
  onDelete: () => void
}

type ConfirmState = { kind: 'discard' } | { kind: 'deactivate' } | { kind: 'delete' }

/**
 * Category create/edit/view screen.
 *
 * Two fields the old form had are deliberately gone: **sort order**, because
 * the server assigns those numbers and a typed one can collide or leave a gap
 * (drag the list instead), and a client-side duplicate-name check, which was
 * only ever tested against the rows that happened to be loaded. The server
 * validates; its field errors land on the inputs.
 */
export function CategoryDetailForm({
  category,
  mode,
  saving,
  fieldErrors,
  errorMessage,
  canEdit,
  canDelete,
  onStartEdit,
  onCancel,
  onSave,
  onDeactivate,
  onDelete,
}: CategoryDetailFormProps) {
  const [form, setForm] = useState<CategoryFormValues>(() => (category ? fromCategory(category) : blankForm()))
  const [savedSig, setSavedSig] = useState(() => signature(form))
  const [preview, setPreview] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

  useEffect(() => {
    const next = category ? fromCategory(category) : blankForm()
    setForm(next)
    setSavedSig(signature(next))
    // Re-seed only when the category identity changes.
  }, [category])

  // An object URL is a live handle, not a string — release it or the blob leaks.
  useEffect(() => {
    if (!(form.media instanceof File)) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(form.media)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [form.media])

  const isView = mode === 'view'
  const dirty = signature(form) !== savedSig
  const set = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const requestLeave = () => (dirty ? setConfirm({ kind: 'discard' }) : onCancel())

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || confirm) return
      requestLeave()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  const pickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) set('media', file)
    e.target.value = ''
  }

  const nameError = fieldErrors.name?.[0]
  const prefixError = fieldErrors.sku_prefix?.[0]
  const shownImage = preview ?? (form.media === null ? null : category?.mediaUrl ?? null)

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <DetailTopBar
        section="Store · Categories"
        title={category ? category.name : 'New category'}
        onBack={requestLeave}
        badges={
          isView ? (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-2.75 py-1.25 text-xs font-medium text-ink-muted ring-1 ring-inset ring-stroke">
              <Icon name="eye" size={14} />
              View only
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary-subtle px-2.75 py-1.25 text-xs font-semibold text-primary-subtle-text">
              <Icon name="pencil-simple" size={14} />
              Editing
            </span>
          )
        }
        actions={
          isView ? (
            canEdit ? (
              <Button theme="primary" iconLeft={<Icon name="pencil-simple" size={14} />} onClick={onStartEdit}>
                Edit
              </Button>
            ) : null
          ) : (
            <>
              <Button theme="default" variant="outline" onClick={requestLeave} disabled={saving}>
                Cancel
              </Button>
              <Button
                theme="primary"
                iconLeft={<Icon name="check" size={16} />}
                loading={saving}
                disabled={saving || !form.name.trim()}
                onClick={() => onSave(form)}
              >
                Save category
              </Button>
            </>
          )
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[620px] flex-col gap-4 px-6 pb-14 pt-6">
          {errorMessage && <Alert type="danger">{errorMessage}</Alert>}

          <div className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
            {isView ? (
              <ViewField label="Category name" value={form.name} />
            ) : (
              <Input
                label="Category name"
                required
                placeholder="e.g. Incense & Dhoop"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                error={nameError}
              />
            )}

            <div className="flex items-start gap-3">
              <div className="w-[140px] flex-shrink-0">
                {isView ? (
                  <ViewField label="SKU prefix" value={form.skuPrefix || '—'} />
                ) : (
                  <Input
                    label="SKU prefix"
                    placeholder="LMP"
                    value={form.skuPrefix}
                    onChange={(e) => set('skuPrefix', e.target.value.toUpperCase())}
                    error={prefixError}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-6.5 text-xs leading-snug text-ink-subtle">
                {/* Stored, not inferred: the codes on a temple's shelf labels follow no rule. */}
                SKUs here read <span className="font-mono">{(form.skuPrefix || 'LMP') + '-001'}</span>. Leave blank to
                derive one from the name.
                {category && category.skuSequence > 0 && (
                  <span className="mt-1 block">
                    Highest issued so far: {category.skuSequence}. Numbers are never reused.
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">Category image</span>
              <div className="flex items-center gap-2.5">
                {shownImage ? (
                  <div
                    className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg bg-cover bg-center shadow-xs"
                    style={{ backgroundImage: `url(${shownImage})` }}
                  >
                    {!isView && (
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => set('media', null)}
                        className="absolute right-0.75 top-0.75 inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border-none bg-overlay text-white"
                      >
                        <Icon name="x" size={12} />
                      </button>
                    )}
                  </div>
                ) : (
                  !isView && (
                    <label className="inline-flex h-[72px] w-[72px] flex-shrink-0 cursor-pointer flex-col items-center justify-center gap-1.25 rounded-lg border border-dashed border-stroke-strong bg-sunken text-ink-subtle hover:bg-hover hover:text-primary">
                      <Icon name="plus" size={18} />
                      <span className="text-2xs">Add</span>
                      <input type="file" accept="image/*" onChange={pickImage} className="hidden" />
                    </label>
                  )
                )}
                {isView && !shownImage && <span className="text-sm text-ink-subtle">—</span>}
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              {isView ? (
                <>
                  <span className={cn('h-2 w-2 rounded-full', form.status === 'active' ? 'bg-success' : 'bg-stroke-strong')} />
                  <span className="text-sm font-medium text-ink-strong">{categoryStatusLabel(form.status)}</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-ink">Status</span>
                  <Switch
                    checked={form.status === 'active'}
                    onChange={() => set('status', form.status === 'active' ? 'inactive' : 'active')}
                    label={categoryStatusLabel(form.status)}
                  />
                </>
              )}
            </div>
          </div>

          {!isView && category && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card px-5.5 py-4.5 shadow-sm">
              <div className="min-w-[200px] flex-1">
                <div className="text-sm font-semibold text-ink-strong">Danger zone</div>
                {/* Delete is NOT disabled by product count: the server refuses only
                    when those products have variants, and a count cannot tell. */}
                <div className="mt-0.5 text-xs text-ink-subtle">
                  {category.productCount > 0
                    ? `${category.productCount} ${category.productCount === 1 ? 'product sits' : 'products sit'} in this category. Deleting is refused if any of them have variants.`
                    : 'Deactivate to hide it from the app, or delete it permanently.'}
                </div>
              </div>
              {form.status === 'active' && (
                <Button
                  theme="default"
                  variant="outline"
                  iconLeft={<Icon name="prohibit" size={15} />}
                  onClick={() => setConfirm({ kind: 'deactivate' })}
                >
                  Deactivate
                </Button>
              )}
              {canDelete && (
                <Button
                  theme="danger"
                  variant="outline"
                  iconLeft={<Icon name="trash" size={15} />}
                  onClick={() => setConfirm({ kind: 'delete' })}
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.kind === 'discard'
            ? 'Discard changes?'
            : confirm?.kind === 'deactivate'
              ? 'Deactivate category?'
              : 'Delete category?'
        }
        body={
          confirm?.kind === 'discard'
            ? 'Your unsaved changes will be lost.'
            : confirm?.kind === 'deactivate'
              ? `"${form.name}" stops appearing in the app. It keeps its products, its name and its place in the order.`
              : `"${form.name}" will be permanently removed. This can’t be undone.`
        }
        confirmLabel={
          confirm?.kind === 'discard' ? 'Discard' : confirm?.kind === 'deactivate' ? 'Deactivate' : 'Delete'
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === 'discard') onCancel()
          else if (confirm?.kind === 'deactivate') onDeactivate()
          else if (confirm?.kind === 'delete') onDelete()
          setConfirm(null)
        }}
      />
    </div>
  )
}
