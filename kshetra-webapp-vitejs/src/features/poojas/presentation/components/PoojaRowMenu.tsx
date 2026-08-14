import { useEffect, useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { Icon, IconButton } from '@/shared/ui'

export interface PoojaRowMenuProps {
  onDuplicate: () => void
  onDelete: () => void
  disabled?: boolean
}

/**
 * The row kebab.
 *
 * Duplicate and Delete are separate permissions on the server — duplicating
 * writes a new pooja and so asks for `add_pooja`, not `change_pooja` — but the
 * menu does not gate them itself; the screen decides what to pass in.
 */
export function PoojaRowMenu({ onDuplicate, onDelete, disabled }: PoojaRowMenuProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <span onClick={(e) => e.stopPropagation()} className="relative inline-flex">
      <IconButton
        size="sm"
        label="Row actions"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="dots-three-vertical" size={18} />
      </IconButton>

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-menu" />
          <div className="absolute right-0 top-[calc(100%+4px)] z-menu min-w-[172px] rounded-lg bg-card p-1.5 text-left shadow-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onDuplicate()
              }}
              className="flex w-full items-center gap-2 rounded-md border-none bg-transparent px-2.25 py-2 text-left font-sans text-sm text-ink hover:bg-hover"
            >
              <Icon name="copy" size={15} className="text-ink-subtle" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md border-none bg-transparent px-2.25 py-2 text-left font-sans text-sm hover:bg-danger-surface',
                'text-danger-strong',
              )}
            >
              <Icon name="trash" size={15} />
              Delete
            </button>
          </div>
        </>
      )}
    </span>
  )
}
