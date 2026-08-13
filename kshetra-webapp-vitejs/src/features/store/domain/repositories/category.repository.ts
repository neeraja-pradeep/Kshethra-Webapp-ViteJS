import type { Result } from '@/core/error/result'
import type { Category, CategoryStatus } from '@/features/store/domain/entities/category'

/** What the create/edit form can write. Read-only fields are not here. */
export interface CategoryWrite {
  readonly name: string
  readonly status?: CategoryStatus
  readonly skuPrefix?: string
  /**
   * A new picture to upload, or `null` to clear it. `undefined` leaves it
   * alone — which is the difference between "no change" and "remove".
   */
  readonly media?: File | null
}

export interface CategoryRepository {
  /**
   * The **whole** list, unfiltered and unpaged.
   *
   * Deliberately takes no filters: the screen drags against this list and
   * `reorderCategories` demands every id exactly once, so a filtered or paged
   * read here would produce a partial order — a guaranteed `400`. Narrowing,
   * if it is ever wanted, has to happen client-side.
   */
  fetchCategories(): Promise<Result<readonly Category[]>>
  createCategory(input: CategoryWrite): Promise<Result<Category>>
  updateCategory(id: number, input: Partial<CategoryWrite>): Promise<Result<Category>>
  /**
   * A category whose products have **variants** is refused (`403`); one whose
   * products have none is deleted along with them. `productCount` cannot tell
   * the two apart, so the server is the only thing that can answer this.
   */
  deleteCategory(id: number): Promise<Result<void>>
  /** Switched off, not removed — it keeps its products and its place in the order. */
  setCategoryStatus(id: number, status: CategoryStatus): Promise<Result<Category>>
  /**
   * Every category id, in the order they should appear. The server numbers them
   * `1..N` in one transaction and hands the reordered list back.
   *
   * One call, not N patches: dragging one row past another moves everything
   * between them, so a per-row write would leave the list half-reordered
   * whenever one failed — and would race any other admin doing the same thing.
   * Inactive categories are included; switched off still holds a position.
   */
  reorderCategories(orderedIds: readonly number[]): Promise<Result<readonly Category[]>>
}
