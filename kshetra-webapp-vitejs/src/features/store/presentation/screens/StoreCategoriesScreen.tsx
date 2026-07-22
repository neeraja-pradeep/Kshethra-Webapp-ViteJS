import { useRef, useState } from 'react'
import type { DragEvent } from 'react'

import { Button, Icon } from '@/shared/ui'

import type { Category } from '@/features/store/domain/entities/category'
import { CATEGORIES } from '@/features/store/presentation/data/categories.mock'
import { PRODUCTS } from '@/features/store/presentation/data/products.mock'

import { CategoryDetailForm, type CategoryFormValues } from '../components/CategoryDetailForm'
import { CategoryRow } from '../components/CategoryRow'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ToastMessage } from '../components/ToastMessage'

interface FormTarget {
  id: string | null
  mode: 'view' | 'edit'
}

/** Store · Categories — reorderable category list plus a view-first create/edit form. */
export function StoreCategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>(CATEGORIES)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null)
  const [listConfirm, setListConfirm] = useState<{ id: string; name: string } | null>(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string) => {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), 2400)
  }

  const sorted = categories.slice().sort((a, b) => a.sortOrder - b.sortOrder)
  const productCountFor = (categoryId: string) => PRODUCTS.filter((p) => p.categoryId === categoryId).length
  const hasProducts = (categoryId: string) => PRODUCTS.some((p) => p.categoryId === categoryId)

  const openCategory = formTarget?.id ? categories.find((c) => c.id === formTarget.id) ?? null : null

  const handleToggleFromList = (c: Category) => {
    if (c.status === 'Active') {
      setListConfirm({ id: c.id, name: c.name })
    } else {
      setCategories((cs) => cs.map((x) => (x.id === c.id ? { ...x, status: 'Active' } : x)))
      showToast(`${c.name} activated`)
    }
  }

  const handleSave = (values: CategoryFormValues) => {
    const name = values.name.trim()
    const sortOrder = parseInt(values.sortOrder, 10) || categories.length + 1
    if (formTarget?.id) {
      const id = formTarget.id
      setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, name, sortOrder, status: values.status } : c)))
      setFormTarget({ id, mode: 'view' })
    } else {
      const id = `cat-${Date.now().toString(36)}`
      setCategories((cs) => cs.concat([{ id, name, sortOrder, status: values.status }]))
      setFormTarget({ id, mode: 'view' })
    }
    showToast('Category saved')
  }

  const handleDragStart = (id: string) => () => setDragId(id)
  const handleDragOver = (id: string) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (dragOverId !== id) setDragOverId(id)
  }
  const handleDrop = (overId: string) => () => {
    if (!dragId || dragId === overId) {
      setDragId(null)
      setDragOverId(null)
      return
    }
    setCategories((cs) => {
      const arr = cs.slice().sort((a, b) => a.sortOrder - b.sortOrder)
      const from = arr.findIndex((c) => c.id === dragId)
      const to = arr.findIndex((c) => c.id === overId)
      if (from < 0 || to < 0) return cs
      const [moved] = arr.splice(from, 1)
      arr.splice(to, 0, moved)
      return arr.map((c, i) => ({ ...c, sortOrder: i + 1 }))
    })
    setDragId(null)
    setDragOverId(null)
    showToast('Category order updated')
  }
  const handleDragEnd = () => {
    setDragId(null)
    setDragOverId(null)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3.5 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Categories</h1>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">Drag to reorder how categories appear in the app.</p>
        </div>
        <Button theme="primary" iconLeft={<Icon name="plus" size={16} />} onClick={() => setFormTarget({ id: null, mode: 'edit' })}>
          Add category
        </Button>
      </div>

      <div className="mx-7 mb-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
        <div className="flex flex-shrink-0 items-center gap-3.5 border-b border-stroke px-4.5 py-2.75 text-2xs font-semibold uppercase tracking-header text-ink-table">
          <span className="w-5.5 flex-shrink-0" />
          <span className="flex-1">Category</span>
          <span className="w-24 flex-shrink-0 text-right">Product count</span>
          <span className="w-[90px] flex-shrink-0 text-center">Sort order</span>
          <span className="w-28 flex-shrink-0">Status</span>
          <span className="w-9 flex-shrink-0" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {sorted.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              productCount={productCountFor(c.id)}
              isDragSource={dragId === c.id}
              isDragOver={dragOverId === c.id}
              onDragStart={handleDragStart(c.id)}
              onDragOver={handleDragOver(c.id)}
              onDrop={handleDrop(c.id)}
              onDragEnd={handleDragEnd}
              onToggleStatus={() => handleToggleFromList(c)}
              onEdit={() => setFormTarget({ id: c.id, mode: 'view' })}
            />
          ))}
          {sorted.length === 0 && <div className="px-8 py-8.5 text-center text-sm text-ink-subtle">No categories yet.</div>}
        </div>
      </div>

      {formTarget && (
        <CategoryDetailForm
          category={openCategory}
          mode={formTarget.mode}
          nextSortOrder={categories.length + 1}
          isNameTaken={(name) => categories.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== formTarget.id)}
          hasProducts={openCategory ? hasProducts(openCategory.id) : false}
          onStartEdit={() => setFormTarget((t) => t && { ...t, mode: 'edit' })}
          onCancel={() => setFormTarget((t) => (t?.id ? { id: t.id, mode: 'view' } : null))}
          onSave={handleSave}
          onDeactivate={() => {
            if (!formTarget.id) return
            const id = formTarget.id
            setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, status: 'Inactive' } : c)))
            showToast(`${openCategory?.name ?? 'Category'} deactivated`)
          }}
          onDelete={() => {
            if (!formTarget.id) return
            const id = formTarget.id
            const name = openCategory?.name ?? 'Category'
            setCategories((cs) => cs.filter((c) => c.id !== id))
            setFormTarget(null)
            showToast(`${name} deleted`)
          }}
        />
      )}

      <ConfirmDialog
        open={!!listConfirm}
        title="Deactivate category?"
        body={`"${listConfirm?.name ?? ''}" stops appearing in the app for new orders. Its products and all history keep their data.`}
        confirmLabel="Deactivate"
        onCancel={() => setListConfirm(null)}
        onConfirm={() => {
          if (listConfirm) {
            setCategories((cs) => cs.map((c) => (c.id === listConfirm.id ? { ...c, status: 'Inactive' } : c)))
            showToast(`${listConfirm.name} deactivated`)
          }
          setListConfirm(null)
        }}
      />

      <ToastMessage show={toast.show} message={toast.message} />
    </div>
  )
}
