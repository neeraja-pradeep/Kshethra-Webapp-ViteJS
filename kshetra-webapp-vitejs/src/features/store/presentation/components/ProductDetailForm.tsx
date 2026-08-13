import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'

import { cn } from '@/shared/lib/cn'
import { formatINR } from '@/shared/lib/format'
import { Alert, Badge, Button, Icon, Input, Select, Switch, Textarea } from '@/shared/ui'

import type { Category } from '@/features/store/domain/entities/category'
import {
  isMultiVariant,
  productStatusLabel,
  type ProductDetail,
  type ProductWritableStatus,
} from '@/features/store/domain/entities/product'
import { stockStateBadge } from '@/features/store/presentation/lib/catalogueFormat'

import { ConfirmDialog } from './ConfirmDialog'
import { DetailTopBar } from './DetailTopBar'
import { SectionLabel, ViewField } from './OverlineField'

/** The server's default, mirrored so a new product's field is pre-filled the same. */
const DEFAULT_LOW_STOCK_THRESHOLD = 10

export interface ProductFormValues {
  name: string
  categoryId: string
  price: string
  description: string
  status: ProductWritableStatus
  lowStockThreshold: string
  /** Files staged for upload — nothing is sent until Save. */
  addedFiles: readonly File[]
  /** Ids of existing images the user removed, sent as `remove_images`. */
  removedImageIds: readonly number[]
}

function blankForm(): ProductFormValues {
  return {
    name: '',
    categoryId: '',
    price: '',
    description: '',
    status: 'active',
    lowStockThreshold: String(DEFAULT_LOW_STOCK_THRESHOLD),
    addedFiles: [],
    removedImageIds: [],
  }
}

function fromProduct(p: ProductDetail): ProductFormValues {
  return {
    name: p.name,
    categoryId: p.category ? String(p.category.id) : '',
    price: p.price == null ? '' : String(p.price),
    description: p.description,
    // A discontinued product cannot be written back through this form's toggle.
    status: p.status === 'inactive' ? 'inactive' : 'active',
    lowStockThreshold: String(p.lowStockThreshold),
    addedFiles: [],
    removedImageIds: [],
  }
}

function signature(f: ProductFormValues): string {
  return JSON.stringify([
    f.name,
    f.categoryId,
    f.price,
    f.description,
    f.status,
    f.lowStockThreshold,
    f.addedFiles.map((file) => `${file.name}:${file.size}`),
    f.removedImageIds,
  ])
}

export interface ProductDetailFormProps {
  /** Null while creating. */
  product: ProductDetail | null
  mode: 'view' | 'edit'
  categories: readonly Category[]
  saving: boolean
  deleting: boolean
  fieldErrors: Record<string, readonly string[]>
  errorMessage: string | null
  canEdit: boolean
  canDelete: boolean
  canAdjustStock: boolean
  onStartEdit: () => void
  onCancel: () => void
  onSave: (values: ProductFormValues) => void
  onOpenAdjustStock: () => void
  onDeactivate: () => void
  onDelete: () => void
  /** The stock history panel, injected so this form does not fetch it itself. */
  stockHistory?: React.ReactNode
}

type ConfirmState =
  | { kind: 'discard' }
  | { kind: 'save-guard'; messages: string[] }
  | { kind: 'deactivate' }
  | { kind: 'delete' }

/**
 * Product create/edit/view screen.
 *
 * One save writes what the API keeps in three tables — product, variant and
 * pictures — in one transaction. Two things the form deliberately does not
 * send: a **SKU**, issued server-side from the category's prefix, and **stock**,
 * which a new product never has and which is filled in afterwards with a logged
 * reason.
 */
export function ProductDetailForm({
  product,
  mode,
  categories,
  saving,
  deleting,
  fieldErrors,
  errorMessage,
  canEdit,
  canDelete,
  canAdjustStock,
  onStartEdit,
  onCancel,
  onSave,
  onOpenAdjustStock,
  onDeactivate,
  onDelete,
  stockHistory,
}: ProductDetailFormProps) {
  const [form, setForm] = useState<ProductFormValues>(() => (product ? fromProduct(product) : blankForm()))
  const [savedSig, setSavedSig] = useState(() => signature(form))
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

  useEffect(() => {
    const next = product ? fromProduct(product) : blankForm()
    setForm(next)
    setSavedSig(signature(next))
    setLocalErrors({})
  }, [product])

  /**
   * Object URLs are live handles, not strings — each one pins its blob in
   * memory until it is revoked, so they are built and released together.
   */
  const previews = useMemo(
    () => form.addedFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [form.addedFiles],
  )
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews])

  const isView = mode === 'view'
  const dirty = signature(form) !== savedSig
  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
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

  // Inactive categories stay selectable when already chosen — otherwise editing
  // a product would silently drop the category it is actually in.
  const categoryOptions = [
    { value: '', label: 'Select a category' },
    ...categories
      .filter((c) => c.status === 'active' || String(c.id) === form.categoryId)
      .map((c) => ({ value: String(c.id), label: c.name })),
  ]

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Product name is required.'
    if (form.price !== '' && Number.isNaN(Number(form.price))) errs.price = 'Enter a valid price.'
    if (form.lowStockThreshold !== '' && Number.isNaN(Number(form.lowStockThreshold))) {
      errs.lowStockThreshold = 'Enter a whole number.'
    }
    return errs
  }

  const attemptSave = (force = false) => {
    const errs = validate()
    if (Object.keys(errs).length) {
      setLocalErrors(errs)
      return
    }
    setLocalErrors({})

    if (product && !force) {
      const messages: string[] = []
      const newPrice = form.price === '' ? 0 : Number(form.price)
      if (product.price != null && newPrice !== product.price) {
        messages.push('Existing orders keep the price they were placed at — the new price applies to new orders only.')
      }
      if (product.status === 'active' && form.status === 'inactive') {
        messages.push('The product stops appearing for new orders; existing orders and history keep their data.')
      }
      if (messages.length) {
        setConfirm({ kind: 'save-guard', messages })
        return
      }
    }
    onSave(form)
    setSavedSig(signature(form))
  }

  const addImages = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) set('addedFiles', [...form.addedFiles, ...files])
    e.target.value = ''
  }

  const keptImages = (product?.images ?? []).filter((image) => !form.removedImageIds.includes(image.id))
  const stockBadge = product ? stockStateBadge(product.stockState) : null
  const priceView = form.price !== '' ? formatINR(Number(form.price)) : '—'
  const err = (key: string, wireKey = key) => localErrors[key] ?? fieldErrors[wireKey]?.[0]

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
                disabled={saving}
                onClick={() => attemptSave()}
              >
                Save product
              </Button>
            </>
          )
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[900px] flex-col gap-4 px-6 pb-14 pt-6">
          {errorMessage && <Alert type="danger">{errorMessage}</Alert>}

          {product && isMultiVariant(product) && (
            <Alert type="info" title="This product has more than one variant">
              The price, SKU and stock shown here belong to the primary variant. There are {product.variantCount} in
              total — manage the rest through the variants API.
            </Alert>
          )}

          <div className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
            <SectionLabel hint={!isView ? 'Name, category, and pricing.' : undefined}>Details</SectionLabel>

            {isView ? (
              <ViewField label="Product name" value={form.name} />
            ) : (
              <Input
                label="Product name"
                required
                placeholder="e.g. Sandalwood Agarbatti (Box of 100)"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                error={err('name')}
              />
            )}

            {/* Issued by the server from the category's prefix — never typed. */}
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1 basis-[160px]">
                <ViewField label="SKU" value={product?.sku ?? (product ? 'No variant yet' : 'Issued on save')} />
              </div>
              <div className="min-w-0 flex-[2] basis-[240px]">
                {isView ? (
                  <ViewField label="Category" value={product?.category?.name ?? '—'} />
                ) : (
                  <Select
                    label="Category"
                    options={categoryOptions}
                    value={form.categoryId}
                    onChange={(e) => set('categoryId', e.target.value)}
                    error={err('categoryId', 'category')}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 basis-[160px]">
                {isView ? (
                  <ViewField label="Price (₹)" value={priceView} />
                ) : (
                  <Input
                    label="Price (₹)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    error={err('price')}
                  />
                )}
              </div>
            </div>

            {(!isView || keptImages.length > 0) && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-ink">Product images</span>
                <div className="flex flex-wrap gap-2.5">
                  {keptImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative h-[84px] w-[84px] flex-shrink-0 overflow-hidden rounded-lg bg-cover bg-center shadow-xs"
                      style={{ backgroundImage: `url(${image.url})` }}
                    >
                      {/* The first image leads — it is the one mirrored to the storefront. */}
                      {index === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-overlay py-0.5 text-center text-2xs text-white">
                          Lead
                        </span>
                      )}
                      {!isView && (
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() => set('removedImageIds', [...form.removedImageIds, image.id])}
                          className="absolute right-0.75 top-0.75 inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border-none bg-overlay text-white"
                        >
                          <Icon name="x" size={12} />
                        </button>
                      )}
                    </div>
                  ))}

                  {previews.map((preview, index) => (
                    <div
                      key={`${preview.file.name}-${index}`}
                      className="relative h-[84px] w-[84px] flex-shrink-0 overflow-hidden rounded-lg bg-cover bg-center shadow-xs ring-1 ring-inset ring-primary"
                      style={{ backgroundImage: `url(${preview.url})` }}
                    >
                      <span className="absolute bottom-0 left-0 right-0 bg-primary py-0.5 text-center text-2xs text-white">
                        New
                      </span>
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => set('addedFiles', form.addedFiles.filter((_, i) => i !== index))}
                        className="absolute right-0.75 top-0.75 inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border-none bg-overlay text-white"
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  ))}

                  {!isView && (
                    <label className="inline-flex h-[84px] w-[84px] flex-shrink-0 cursor-pointer flex-col items-center justify-center gap-1.25 rounded-lg border border-dashed border-stroke-strong bg-sunken text-ink-subtle hover:bg-hover hover:text-primary">
                      <Icon name="plus" size={18} />
                      <span className="text-2xs">Add</span>
                      <input type="file" accept="image/*" multiple onChange={addImages} className="hidden" />
                    </label>
                  )}
                </div>
                {!isView && <span className="text-2xs text-ink-subtle">Images are uploaded when you save.</span>}
              </div>
            )}

            {(!isView || form.description.trim()) &&
              (isView ? (
                <ViewField label="Description" value={form.description} />
              ) : (
                <Textarea
                  label="Description"
                  placeholder="Short description shown in the app store."
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              ))}

            <div className="flex items-center gap-2.5 pt-1">
              {isView ? (
                <>
                  <span className={cn('h-2 w-2 rounded-full', product?.status === 'active' ? 'bg-success' : 'bg-stroke-strong')} />
                  <span className="text-sm font-medium text-ink-strong">
                    {productStatusLabel(product?.status ?? form.status)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-ink">Status</span>
                  <Switch
                    checked={form.status === 'active'}
                    onChange={() => set('status', form.status === 'active' ? 'inactive' : 'active')}
                    label={productStatusLabel(form.status)}
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <SectionLabel hint="Stock is managed here — no separate inventory screen.">Inventory</SectionLabel>
              </div>
              {stockBadge && (
                <Badge size="sm" color={stockBadge.color}>
                  {stockBadge.label}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-active px-4 py-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Current stock</span>
                <span className="text-2xl font-bold tabular-nums text-ink-strong">{product?.stockQuantity ?? 0}</span>
              </div>
              <div className="my-1 w-px self-stretch bg-stroke" />
              <div className="flex flex-col gap-0.5">
                <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">
                  Low-stock alert at
                </span>
                {isView ? (
                  <span className="tabular-nums text-base font-medium text-ink">
                    {product?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD} units
                  </span>
                ) : (
                  <div className="w-[120px]">
                    <Input
                      type="number"
                      min={0}
                      value={form.lowStockThreshold}
                      onChange={(e) => set('lowStockThreshold', e.target.value)}
                      error={err('lowStockThreshold', 'low_stock_threshold')}
                    />
                  </div>
                )}
              </div>
              <div className="flex-1" />
              {canAdjustStock && (
                <Button
                  theme="default"
                  variant="outline"
                  disabled={!product}
                  iconLeft={<Icon name="arrows-clockwise" size={15} />}
                  onClick={onOpenAdjustStock}
                >
                  Adjust stock
                </Button>
              )}
            </div>

            {!product && (
              <div className="text-2xs text-ink-subtle">
                Save the product first, then adjust stock with a logged reason.
              </div>
            )}
            {/* Threshold is per variant: a temple sells camphor by the hundred
                and brass idols by the handful. */}
            {!isView && (
              <div className="text-2xs text-ink-subtle">
                Low-stock alert is per product — set it to suit how fast this line moves.
              </div>
            )}

            {stockHistory}
          </div>

          {!isView && product && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card px-5.5 py-4.5 shadow-sm">
              <div className="min-w-[200px] flex-1">
                <div className="text-sm font-semibold text-ink-strong">Danger zone</div>
                <div className="mt-0.5 text-xs text-ink-subtle">
                  Deactivate to hide it from the store, or delete permanently.
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
                  loading={deleting}
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
                : `"${form.name}" will be permanently removed. This can’t be undone.`
        }
        confirmLabel={
          confirm?.kind === 'discard'
            ? 'Discard'
            : confirm?.kind === 'save-guard'
              ? 'Save changes'
              : confirm?.kind === 'deactivate'
                ? 'Deactivate'
                : 'Delete'
        }
        danger={confirm?.kind !== 'save-guard'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === 'discard') onCancel()
          else if (confirm?.kind === 'save-guard') attemptSave(true)
          else if (confirm?.kind === 'deactivate') onDeactivate()
          else if (confirm?.kind === 'delete') onDelete()
          setConfirm(null)
        }}
      />
    </div>
  )
}
