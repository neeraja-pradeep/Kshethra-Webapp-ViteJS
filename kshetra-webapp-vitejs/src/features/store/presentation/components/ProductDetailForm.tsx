import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'

import { formatINR } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { Badge, Button, Icon, Input, Select, Switch, Textarea } from '@/shared/ui'

import type { Category } from '@/features/store/domain/entities/category'
import type { Product, ProductStatus } from '@/features/store/domain/entities/product'
import { stockLevel } from '@/features/store/presentation/lib/storeFormat'

import { AdjustStockModal } from './AdjustStockModal'
import { ConfirmDialog } from './ConfirmDialog'
import { DetailTopBar } from './DetailTopBar'
import { SectionLabel, ViewField } from './OverlineField'

export interface ProductFormValues {
  name: string
  categoryId: string
  price: string
  description: string
  images: string[]
  status: ProductStatus
}

function blankForm(): ProductFormValues {
  return { name: '', categoryId: '', price: '', description: '', images: [], status: 'Active' }
}

function fromProduct(p: Product): ProductFormValues {
  return { name: p.name, categoryId: p.categoryId, price: String(p.price), description: p.description, images: [...p.images], status: p.status }
}

function signature(f: ProductFormValues): string {
  return JSON.stringify([f.name, f.categoryId, f.price, f.description, f.images, f.status])
}

export interface ProductDetailFormProps {
  /** null while creating a new product. */
  product: Product | null
  mode: 'view' | 'edit'
  categories: readonly Category[]
  hasOrders: boolean
  onStartEdit: () => void
  /** Called once it's safe to leave edit mode (no unsaved changes, or the user confirmed discarding them). */
  onCancel: () => void
  onSave: (values: ProductFormValues) => void
  onAdjustStock: (newStock: number, reason: string) => void
  onDeactivate: () => void
  onDelete: () => void
}

type ConfirmState =
  | { kind: 'discard' }
  | { kind: 'save-guard'; messages: string[] }
  | { kind: 'deactivate' }
  | { kind: 'delete' }

/** Product create/edit/view screen — view-first for existing products, editable for new ones. */
export function ProductDetailForm({ product, mode, categories, hasOrders, onStartEdit, onCancel, onSave, onAdjustStock, onDeactivate, onDelete }: ProductDetailFormProps) {
  const [form, setForm] = useState<ProductFormValues>(() => (product ? fromProduct(product) : blankForm()))
  const [savedSig, setSavedSig] = useState(() => signature(form))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustValue, setAdjustValue] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustError, setAdjustError] = useState('')

  // Re-seed the draft whenever a different product is opened (or we return to a fresh "new product" form).
  useEffect(() => {
    const next = product ? fromProduct(product) : blankForm()
    setForm(next)
    setSavedSig(signature(next))
    setErrors({})
  }, [product])

  const isView = mode === 'view'
  const dirty = signature(form) !== savedSig

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => setForm((f) => ({ ...f, [key]: value }))

  const requestLeave = () => {
    if (dirty) {
      setConfirm({ kind: 'discard' })
    } else {
      onCancel()
    }
  }

  // Escape closes the topmost layer: a nested modal handles itself; otherwise this screen backs out.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || confirm || adjustOpen) return
      requestLeave()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  const categoryOptions = [
    { value: '', label: 'Select a category' },
    ...categories
      .filter((c) => c.status === 'Active' || c.id === form.categoryId)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ value: c.id, label: c.name })),
  ]

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Product name is required.'
    if (!form.categoryId) errs.categoryId = 'Choose a category.'
    if (form.price === '' || Number.isNaN(parseInt(form.price, 10))) errs.price = 'Enter a price.'
    return errs
  }

  const attemptSave = (force = false) => {
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    if (product && !force) {
      const messages: string[] = []
      const newPrice = parseInt(form.price, 10) || 0
      if (newPrice !== product.price) messages.push('Existing orders keep the price they were placed at — the new price applies to new orders only.')
      if (product.status === 'Active' && form.status === 'Inactive') messages.push('The product stops appearing for new orders; existing orders and history keep their data.')
      if (messages.length) {
        setConfirm({ kind: 'save-guard', messages })
        return
      }
    }
    onSave(form)
    setSavedSig(signature(form))
  }

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('images', form.images.concat([String(reader.result)]))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const openAdjust = () => {
    setAdjustValue(String(product?.stock ?? 0))
    setAdjustReason('')
    setAdjustError('')
    setAdjustOpen(true)
  }
  const saveAdjust = () => {
    const reason = adjustReason.trim()
    if (!reason) {
      setAdjustError('A reason is required.')
      return
    }
    const nv = parseInt(adjustValue, 10)
    if (Number.isNaN(nv) || nv < 0) {
      setAdjustError('Enter a valid quantity.')
      return
    }
    onAdjustStock(nv, reason)
    setAdjustOpen(false)
  }

  const stock = stockLevel({ stock: product?.stock ?? 0, lowStockThreshold: product?.lowStockThreshold ?? 10 })
  const priceView = form.price !== '' && form.price != null ? formatINR(Number(form.price)) : '—'

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <DetailTopBar
        section="Store · Products"
        title={product ? product.name : 'New product'}
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
              <Button theme="primary" iconLeft={<Icon name="check" size={16} />} onClick={() => attemptSave()}>
                Save product
              </Button>
            </>
          )
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[900px] flex-col gap-4 px-6 pb-14 pt-6">
          <div className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
            <SectionLabel hint={!isView ? 'Name, category, and pricing.' : undefined}>Details</SectionLabel>

            {isView ? (
              <ViewField label="Product name" value={form.name} />
            ) : (
              <Input label="Product name" required placeholder="e.g. Sandalwood Agarbatti (Box of 100)" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
            )}

            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-[2] basis-[240px]">
                {isView ? (
                  <ViewField label="Category" value={categories.find((c) => c.id === form.categoryId)?.name ?? '—'} />
                ) : (
                  <Select label="Category" options={categoryOptions} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} error={errors.categoryId} />
                )}
              </div>
              <div className="min-w-0 flex-1 basis-[160px]">
                {isView ? <ViewField label="Price (₹)" value={priceView} /> : <Input label="Price (₹)" type="number" placeholder="0" value={form.price} onChange={(e) => set('price', e.target.value)} error={errors.price} />}
              </div>
            </div>

            {(!isView || form.images.length > 0) && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-ink">Product images</span>
                <div className="flex flex-wrap gap-2.5">
                  {form.images.map((src, i) => (
                    <div key={i} className="relative h-[84px] w-[84px] flex-shrink-0 overflow-hidden rounded-lg bg-cover bg-center shadow-xs" style={{ backgroundImage: `url(${src})` }}>
                      {!isView && (
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() => set('images', form.images.filter((_, idx) => idx !== i))}
                          className="absolute right-0.75 top-0.75 inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border-none bg-overlay text-white"
                        >
                          <Icon name="x" size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {!isView && (
                    <label className="inline-flex h-[84px] w-[84px] flex-shrink-0 cursor-pointer flex-col items-center justify-center gap-1.25 rounded-lg bg-sunken text-ink-subtle border border-dashed border-stroke-strong hover:bg-hover hover:text-primary">
                      <Icon name="plus" size={18} />
                      <span className="text-2xs">Add</span>
                      <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            )}

            {(!isView || form.description.trim()) &&
              (isView ? <ViewField label="Description" value={form.description} /> : <Textarea label="Description" placeholder="Short description shown in the app store." rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />)}

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

          <div className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <SectionLabel hint="Stock is managed here — no separate inventory screen.">Inventory</SectionLabel>
              </div>
              <Badge size="sm" color={stock.color}>
                {stock.label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-active px-4 py-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Current stock</span>
                <span className="text-2xl font-bold tabular-nums text-ink-strong">{product?.stock ?? 0}</span>
              </div>
              <div className="my-1 w-px self-stretch bg-stroke" />
              <div className="flex flex-col gap-0.5">
                <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Low-stock alert at</span>
                <span className="tabular-nums text-base font-medium text-ink">{product?.lowStockThreshold ?? 10} units</span>
              </div>
              <div className="flex-1" />
              <Button theme="default" variant="outline" disabled={!product} iconLeft={<Icon name="arrows-clockwise" size={15} />} onClick={openAdjust}>
                Adjust stock
              </Button>
            </div>
            {!product && <div className="text-2xs text-ink-subtle">Save the product first, then adjust stock with a logged reason.</div>}
            {product && product.stockLog.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Stock adjustment log</span>
                {product.stockLog.map((l, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-3 rounded-md bg-sunken px-3 py-2.25">
                    <div className="min-w-0">
                      <span className="tabular-nums text-sm font-medium text-ink-strong">{l.change}</span>
                      <span className="text-xs text-ink-muted"> · {l.reason}</span>
                    </div>
                    <span className="whitespace-nowrap text-2xs text-ink-subtle">{l.who}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isView && product && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card px-5.5 py-4.5 shadow-sm">
              <div className="min-w-[200px] flex-1">
                <div className="text-sm font-semibold text-ink-strong">Danger zone</div>
                <div className="mt-0.5 text-xs text-ink-subtle">
                  {hasOrders ? 'This product appears in existing orders, so it can’t be deleted — deactivate it instead.' : 'Deactivate to hide from the store, or delete permanently.'}
                </div>
              </div>
              {form.status === 'Active' && (
                <Button theme="default" variant="outline" iconLeft={<Icon name="prohibit" size={15} />} onClick={() => setConfirm({ kind: 'deactivate' })}>
                  Deactivate
                </Button>
              )}
              <Button theme="danger" variant="outline" disabled={hasOrders} iconLeft={<Icon name="trash" size={15} />} onClick={() => setConfirm({ kind: 'delete' })}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <AdjustStockModal
        open={adjustOpen}
        productName={product?.name ?? ''}
        currentStock={product?.stock ?? 0}
        value={adjustValue}
        reason={adjustReason}
        error={adjustError}
        onValueChange={setAdjustValue}
        onReasonChange={(v) => {
          setAdjustReason(v)
          setAdjustError('')
        }}
        onClose={() => setAdjustOpen(false)}
        onSave={saveAdjust}
      />

      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.kind === 'discard'
            ? 'Discard changes?'
            : confirm?.kind === 'save-guard'
              ? 'Apply changes to new orders?'
              : confirm?.kind === 'deactivate'
                ? 'Deactivate product?'
                : 'Delete product?'
        }
        body={
          confirm?.kind === 'discard'
            ? 'Your unsaved changes will be lost.'
            : confirm?.kind === 'save-guard'
              ? confirm.messages.join(' ')
              : confirm?.kind === 'deactivate'
                ? `"${form.name}" stops appearing in the app store for new orders. Existing orders and history keep their data.`
                : `"${form.name}" will be permanently removed — allowed because no orders reference it. This can’t be undone.`
        }
        confirmLabel={confirm?.kind === 'discard' ? 'Discard' : confirm?.kind === 'save-guard' ? 'Save changes' : confirm?.kind === 'deactivate' ? 'Deactivate' : 'Delete'}
        danger={confirm?.kind !== 'save-guard'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === 'discard') onCancel()
          else if (confirm?.kind === 'save-guard') attemptSave(true)
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
