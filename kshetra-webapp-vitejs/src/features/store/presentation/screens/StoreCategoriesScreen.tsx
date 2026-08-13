import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent } from 'react'

import { toFailure, toFieldErrors } from '@/core/error/result'
import { Alert, Button, Icon, Spinner } from '@/shared/ui'

import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { useCan } from '@/features/auth/application/hooks/useCan'
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
  useSetCategoryStatusMutation,
  useUpdateCategoryMutation,
} from '@/features/store/application/queries/useCategoryMutations'
import { useCategoriesQuery } from '@/features/store/application/queries/useCategoriesQuery'
import type { Category } from '@/features/store/domain/entities/category'

import { CategoryDetailForm, type CategoryFormValues } from '../components/CategoryDetailForm'
import { CategoryRow } from '../components/CategoryRow'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ToastMessage } from '../components/ToastMessage'

const TOAST_MS = 2400

interface FormTarget {
  id: number | null
  mode: 'view' | 'edit'
}

/**
 * Store · Categories — the app's shop navigation, in the order devotees see it.
 *
 * The list is deliberately unfiltered and unpaged: reordering sends every id at
 * once, so anything that narrowed what is loaded would submit a partial order
 * and be refused.
 */
export function StoreCategoriesScreen() {
  const can = useCan()
  const canEdit = can(PERMISSIONS.changeCategory)
  const canAdd = can(PERMISSIONS.addCategory)
  const canDelete = can(PERMISSIONS.deleteCategory)

  const categoriesQuery = useCategoriesQuery()
  const createCategory = useCreateCategoryMutation()
  const updateCategory = useUpdateCategoryMutation()
  const setStatus = useSetCategoryStatusMutation()
  const deleteCategory = useDeleteCategoryMutation()
  const reorder = useReorderCategoriesMutation()

  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null)
  const [listConfirm, setListConfirm] = useState<{ id: number; name: string } | null>(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const showToast = (message: string) => {
    setToast({ show: true, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '' }), TOAST_MS)
  }

  // Served in sort_order already; sorting again keeps the list honest if a
  // response ever arrives out of order.
  const categories = useMemo(
    () => [...(categoriesQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [categoriesQuery.data],
  )

  const openCategory = formTarget?.id != null ? categories.find((c) => c.id === formTarget.id) ?? null : null
  const listFailure = toFailure(categoriesQuery.error)
  const writeFailure =
    toFailure(createCategory.error) ??
    toFailure(updateCategory.error) ??
    toFailure(deleteCategory.error) ??
    toFailure(setStatus.error)
  const reorderFailure = toFailure(reorder.error)

  function handleToggleFromList(category: Category) {
    if (category.status === 'active') {
      setListConfirm({ id: category.id, name: category.name })
      return
    }
    setStatus.mutate(
      { id: category.id, status: 'active' },
      { onSuccess: () => showToast(`${category.name} activated`) },
    )
  }

  function handleSave(values: CategoryFormValues) {
    const input = {
      name: values.name.trim(),
      status: values.status,
      skuPrefix: values.skuPrefix.trim(),
      ...(values.media !== undefined ? { media: values.media } : {}),
    }
    if (formTarget?.id != null) {
      const id = formTarget.id
      updateCategory.mutate(
        { id, input },
        {
          onSuccess: () => {
            setFormTarget({ id, mode: 'view' })
            showToast('Category saved')
          },
        },
      )
      return
    }
    createCategory.mutate(input, {
      onSuccess: (created) => {
        setFormTarget({ id: created.id, mode: 'view' })
        showToast('Category created')
      },
    })
  }

  const handleDragStart = (id: number) => () => setDragId(id)
  const handleDragOver = (id: number) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (dragOverId !== id) setDragOverId(id)
  }
  const handleDragEnd = () => {
    setDragId(null)
    setDragOverId(null)
  }

  /**
   * Sends the **complete** order, not the moved row.
   *
   * The client computes no `sort_order`: it says what the order should be and
   * the server numbers it `1..N`, which is what stops gaps, duplicates, and a
   * number colliding with a category this screen could not see.
   */
  const handleDrop = (overId: number) => () => {
    const from = categories.findIndex((c) => c.id === dragId)
    const to = categories.findIndex((c) => c.id === overId)
    handleDragEnd()
    if (dragId == null || dragId === overId || from < 0 || to < 0) return

    const ids = categories.map((c) => c.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved as number)
    reorder.mutate(ids, { onSuccess: () => showToast('Category order updated') })
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sunken">
      <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3.5 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Categories</h1>
          <p className="m-0 mt-1.5 text-sm text-ink-muted">Drag to reorder how categories appear in the app.</p>
        </div>
        {canAdd && (
          <Button
            theme="primary"
            iconLeft={<Icon name="plus" size={16} />}
            onClick={() => setFormTarget({ id: null, mode: 'edit' })}
          >
            Add category
          </Button>
        )}
      </div>

      {(listFailure || writeFailure || reorderFailure) && (
        <div className="px-7 pb-3">
          <Alert type="danger" title={reorderFailure ? 'The order was not saved' : undefined}>
            {(listFailure ?? writeFailure ?? reorderFailure)?.message}
          </Alert>
        </div>
      )}

      <div className="mx-7 mb-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-xs">
        <div className="flex flex-shrink-0 items-center gap-3.5 border-b border-stroke px-4.5 py-2.75 text-2xs font-semibold uppercase tracking-header text-ink-table">
          <span className="w-5.5 flex-shrink-0" />
          <span className="flex-1">Category</span>
          <span className="w-24 flex-shrink-0 text-right">Product count</span>
          <span className="w-[90px] flex-shrink-0 text-center">Sort order</span>
          <span className="w-28 flex-shrink-0">Status</span>
          <span className="w-9 flex-shrink-0" />
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto ${reorder.isPending ? 'opacity-70' : ''}`}>
          {categoriesQuery.isPending ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-ink-subtle">
              <Spinner size={26} />
              <span className="text-sm">Loading categories…</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="px-8 py-8.5 text-center text-sm text-ink-subtle">No categories yet.</div>
          ) : (
            categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                isDragSource={dragId === category.id}
                isDragOver={dragOverId === category.id}
                // A second drop mid-flight would send an order built from rows
                // the server has already renumbered.
                disabled={reorder.isPending}
                canEdit={canEdit}
                onDragStart={handleDragStart(category.id)}
                onDragOver={handleDragOver(category.id)}
                onDrop={handleDrop(category.id)}
                onDragEnd={handleDragEnd}
                onToggleStatus={() => handleToggleFromList(category)}
                onEdit={() => setFormTarget({ id: category.id, mode: 'view' })}
              />
            ))
          )}
        </div>
      </div>

      {formTarget && (
        <CategoryDetailForm
          category={openCategory}
          mode={formTarget.mode}
          saving={createCategory.isPending || updateCategory.isPending}
          fieldErrors={toFieldErrors(createCategory.error ?? updateCategory.error)}
          errorMessage={(toFailure(createCategory.error) ?? toFailure(updateCategory.error))?.message ?? null}
          canEdit={canEdit}
          canDelete={canDelete}
          onStartEdit={() => setFormTarget((t) => t && { ...t, mode: 'edit' })}
          onCancel={() => setFormTarget((t) => (t?.id != null ? { id: t.id, mode: 'view' } : null))}
          onSave={handleSave}
          onDeactivate={() => {
            if (!openCategory) return
            setStatus.mutate(
              { id: openCategory.id, status: 'inactive' },
              { onSuccess: () => showToast(`${openCategory.name} deactivated`) },
            )
          }}
          onDelete={() => {
            if (!openCategory) return
            const name = openCategory.name
            deleteCategory.mutate(openCategory.id, {
              onSuccess: () => {
                setFormTarget(null)
                showToast(`${name} deleted`)
              },
            })
          }}
        />
      )}

      <ConfirmDialog
        open={!!listConfirm}
        title="Deactivate category?"
        body={`"${listConfirm?.name ?? ''}" stops appearing in the app. It keeps its products, its name and its place in the order.`}
        confirmLabel="Deactivate"
        onCancel={() => setListConfirm(null)}
        onConfirm={() => {
          if (listConfirm) {
            setStatus.mutate(
              { id: listConfirm.id, status: 'inactive' },
              { onSuccess: () => showToast(`${listConfirm.name} deactivated`) },
            )
          }
          setListConfirm(null)
        }}
      />

      <ToastMessage show={toast.show} message={toast.message} />
    </div>
  )
}
