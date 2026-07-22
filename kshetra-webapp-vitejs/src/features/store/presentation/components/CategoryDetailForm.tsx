import { useEffect, useRef, useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { Button, Icon, Input, Switch } from '@/shared/ui'

import type { Category, CategoryStatus } from '@/features/store/domain/entities/category'

import { ConfirmDialog } from './ConfirmDialog'
import { DetailTopBar } from './DetailTopBar'
import { ViewField } from './OverlineField'

export interface CategoryFormValues {
  name: string
  sortOrder: string
  status: CategoryStatus
}

function blankForm(nextOrder: number): CategoryFormValues {
  return { name: '', sortOrder: String(nextOrder), status: 'Active' }
}
function fromCategory(c: Category): CategoryFormValues {
  return { name: c.name, sortOrder: String(c.sortOrder), status: c.status }
}
function signature(f: CategoryFormValues): string {
  return JSON.stringify([f.name, f.sortOrder, f.status])
}

export interface CategoryDetailFormProps {
  category: Category | null
  mode: 'view' | 'edit'
  /** Suggested sort order for a brand-new category. */
  nextSortOrder: number
  /** True when another category already has this (trimmed, case-insensitive) name. */
  isNameTaken: (name: string) => boolean
  hasProducts: boolean
  onStartEdit: () => void
  onCancel: () => void
  onSave: (values: CategoryFormValues) => void
  onDeactivate: () => void
  onDelete: () => void
}

type ConfirmState = { kind: 'discard' } | { kind: 'deactivate' } | { kind: 'delete' }

/** Category create/edit/view screen — view-first for existing categories, editable for new ones. */
export function CategoryDetailForm({ category, mode, nextSortOrder, isNameTaken, hasProducts, onStartEdit, onCancel, onSave, onDeactivate, onDelete }: CategoryDetailFormProps) {
  const [form, setForm] = useState<CategoryFormValues>(() => (category ? fromCategory(category) : blankForm(nextSortOrder)))
  const [savedSig, setSavedSig] = useState(() => signature(form))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

  // nextSortOrder only seeds a brand-new blank form; it must not reactively
  // re-seed (and wipe) an in-progress draft, so it is read through a ref.
  const nextSortOrderRef = useRef(nextSortOrder)
  nextSortOrderRef.current = nextSortOrder

  useEffect(() => {
    const next = category ? fromCategory(category) : blankForm(nextSortOrderRef.current)
    setForm(next)
    setSavedSig(signature(next))
    setErrors({})
    // Re-seed only when the category identity changes.
  }, [category])

  const isView = mode === 'view'
  const dirty = signature(form) !== savedSig
  const set = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) => setForm((f) => ({ ...f, [key]: value }))

  const requestLeave = () => (dirty ? setConfirm({ kind: 'discard' }) : onCancel())

  // Escape closes the topmost layer: a nested modal handles itself; otherwise this screen backs out.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || confirm) return
      requestLeave()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  const attemptSave = () => {
    const name = form.name.trim()
    const errs: Record<string, string> = {}
    if (!name) errs.name = 'Category name is required.'
    else if (isNameTaken(name)) errs.name = 'A category with this name already exists.'
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    onSave(form)
    setSavedSig(signature(form))
  }

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
            <Button theme="primary" iconLeft={<Icon name="pencil-simple" size={14} />} onClick={onStartEdit}>
              Edit
            </Button>
          ) : (
            <>
              <Button theme="default" variant="outline" onClick={requestLeave}>
                Cancel
              </Button>
              <Button theme="primary" iconLeft={<Icon name="check" size={16} />} onClick={attemptSave}>
                Save category
              </Button>
            </>
          )
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[620px] flex-col gap-4 px-6 pb-14 pt-6">
          <div className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
            {isView ? (
              <ViewField label="Category name" value={form.name} />
            ) : (
              <Input label="Category name" required placeholder="e.g. Incense & Dhoop" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
            )}

            <div className="flex items-start gap-3">
              <div className="w-[140px] flex-shrink-0">
                {isView ? <ViewField label="Sort order" value={form.sortOrder} /> : <Input label="Sort order" type="number" placeholder="0" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />}
              </div>
              {!isView && (
                <div className="min-w-0 flex-1 pt-6.5 text-xs leading-snug text-ink-subtle">Lower numbers appear first in the app. You can also drag to reorder on the list.</div>
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              {isView ? (
                <>
                  <span className={cn('h-2 w-2 rounded-full', form.status === 'Active' ? 'bg-success' : 'bg-stroke-strong')} />
                  <span className="text-sm font-medium text-ink-strong">{form.status}</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-ink">Status</span>
                  <Switch checked={form.status === 'Active'} onChange={() => set('status', form.status === 'Active' ? 'Inactive' : 'Active')} label={form.status} />
                </>
              )}
            </div>
          </div>

          {!isView && category && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card px-5.5 py-4.5 shadow-sm">
              <div className="min-w-[200px] flex-1">
                <div className="text-sm font-semibold text-ink-strong">Danger zone</div>
                <div className="mt-0.5 text-xs text-ink-subtle">
                  {hasProducts ? 'This category has products, so it can’t be deleted — move or remove them first, or just deactivate.' : 'Deactivate to hide from the app, or delete permanently.'}
                </div>
              </div>
              {form.status === 'Active' && (
                <Button theme="default" variant="outline" iconLeft={<Icon name="prohibit" size={15} />} onClick={() => setConfirm({ kind: 'deactivate' })}>
                  Deactivate
                </Button>
              )}
              <Button theme="danger" variant="outline" disabled={hasProducts} iconLeft={<Icon name="trash" size={15} />} onClick={() => setConfirm({ kind: 'delete' })}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.kind === 'discard' ? 'Discard changes?' : confirm?.kind === 'deactivate' ? 'Deactivate category?' : 'Delete category?'}
        body={
          confirm?.kind === 'discard'
            ? 'Your unsaved changes will be lost.'
            : confirm?.kind === 'deactivate'
              ? `"${form.name}" stops appearing in the app for new orders. Its products and all history keep their data.`
              : `"${form.name}" will be permanently removed. This can’t be undone.`
        }
        confirmLabel={confirm?.kind === 'discard' ? 'Discard' : confirm?.kind === 'deactivate' ? 'Deactivate' : 'Delete'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === 'discard') onCancel()
          else if (confirm?.kind === 'deactivate') {
            onDeactivate()
            set('status', 'Inactive')
          } else if (confirm?.kind === 'delete') onDelete()
          setConfirm(null)
        }}
      />
    </div>
  )
}
