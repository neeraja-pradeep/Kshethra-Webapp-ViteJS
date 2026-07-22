import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui'

import { NAV, type NavItem, type NavLeaf } from './nav'

interface SidebarProps {
  collapsed: boolean
  onNavigate?: () => void
}

function isGroupActive(item: NavItem, pathname: string): boolean {
  return !!item.children?.some((c) => pathname.startsWith(c.path))
}

/** Primary navigation rail. Renders leaves + expandable groups from NAV. */
export function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const item of NAV) if (item.children) init[item.id] = isGroupActive(item, pathname)
    return init
  })

  // Auto-expand the group that owns the active route.
  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev }
      for (const item of NAV) if (item.children && isGroupActive(item, pathname)) next[item.id] = true
      return next
    })
  }, [pathname])

  const leafClass = (active: boolean) =>
    cn(
      'flex w-full items-center gap-2.75 rounded-lg text-sm text-left transition-[background,color] duration-120 ease-ks',
      collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
      active
        ? 'bg-primary font-semibold text-white shadow-xs'
        : 'bg-transparent font-medium text-ink-muted hover:bg-side-hover',
    )

  const renderLeaf = (leaf: NavLeaf, indented: boolean) => (
    <NavLink
      key={leaf.id}
      to={leaf.path}
      onClick={onNavigate}
      title={collapsed ? leaf.label : undefined}
      className={({ isActive }) =>
        cn(leafClass(isActive), indented && !collapsed && 'pl-9')
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={leaf.icon} size={18} weight={isActive ? 'fill' : 'regular'} className="w-4.5 shrink-0 text-center" />
          {!collapsed && <span className="flex-1 truncate">{leaf.label}</span>}
        </>
      )}
    </NavLink>
  )

  let prevGroup = 0
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2.5 py-3">
      {NAV.map((item) => {
        const divider = item.group !== prevGroup
        prevGroup = item.group
        const groupActive = item.children ? isGroupActive(item, pathname) : false
        const node = (
          <div key={item.id} className="contents">
            {divider && <div role="separator" className="mx-2 my-2.5 h-px shrink-0 bg-side-divider" />}
            {item.children ? (
              <>
                <button
                  type="button"
                  onClick={() => (collapsed ? undefined : setOpen((o) => ({ ...o, [item.id]: !o[item.id] })))}
                  title={collapsed ? item.label : undefined}
                  aria-expanded={!!open[item.id]}
                  className={cn(
                    'flex w-full items-center gap-2.75 rounded-lg text-sm text-left transition-[background,color] duration-120 ease-ks',
                    collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                    groupActive ? 'font-semibold text-ink-strong' : 'font-medium text-ink-muted',
                    'bg-transparent hover:bg-side-hover',
                  )}
                >
                  <Icon name={item.icon} size={18} weight={groupActive ? 'fill' : 'regular'} className="w-4.5 shrink-0 text-center" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      <Icon
                        name="caret-right"
                        size={13}
                        className={cn('shrink-0 opacity-55 transition-transform duration-160', open[item.id] && 'rotate-90')}
                      />
                    </>
                  )}
                </button>
                {!collapsed && open[item.id] && item.children.map((c) => renderLeaf(c, true))}
              </>
            ) : (
              renderLeaf(item as NavLeaf, false)
            )}
          </div>
        )
        return node
      })}
    </nav>
  )
}
