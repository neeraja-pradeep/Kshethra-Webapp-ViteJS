import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { NARROW_BREAKPOINT } from '@/core/config/app'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { cn } from '@/shared/lib/cn'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** The application shell: fixed topbar + sidebar (drawer under 900px) + content. */
export function AdminLayout() {
  const isNarrow = useMediaQuery(`(max-width: ${NARROW_BREAKPOINT - 1}px)`)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Close the mobile drawer whenever we grow back to desktop.
  useEffect(() => {
    if (!isNarrow) setDrawerOpen(false)
  }, [isNarrow])

  const onToggleNav = () => (isNarrow ? setDrawerOpen((o) => !o) : setCollapsed((c) => !c))

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-sunken font-sans text-ink">
      <Topbar onToggleNav={onToggleNav} navExpanded={isNarrow ? drawerOpen : !collapsed} />

      <div className="relative flex min-h-0 flex-1">
        <aside
          aria-label="Primary navigation"
          className={cn(
            'flex shrink-0 flex-col bg-sidebar',
            isNarrow
              ? cn(
                  'fixed bottom-0 left-0 top-15 z-drawer w-60 shadow-lg transition-transform duration-160 ease-ks',
                  drawerOpen ? 'translate-x-0' : '-translate-x-full',
                )
              : collapsed
                ? 'w-15'
                : 'w-60',
          )}
        >
          <Sidebar collapsed={!isNarrow && collapsed} onNavigate={() => isNarrow && setDrawerOpen(false)} />
        </aside>

        {isNarrow && drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed bottom-0 left-0 right-0 top-15 z-scrim bg-overlay [backdrop-filter:blur(2px)]"
          />
        )}

        <main className="relative min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
