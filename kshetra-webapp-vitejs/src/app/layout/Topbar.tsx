import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { APP_NAME, BRAND_MARK } from '@/core/config/app'
import { Avatar, Icon, Spinner } from '@/shared/ui'

import { useMyPermissionsQuery } from '@/features/auth/application/queries/useMyPermissionsQuery'
import { useSignOutMutation } from '@/features/auth/application/queries/useSignOutMutation'
import { sessionDisplayName, sessionRoleLabel } from '@/features/auth/domain/entities/session-user'

interface TopbarProps {
  onToggleNav: () => void
  navExpanded: boolean
}

/** Fixed 60px application top bar: nav toggle, brand, and the account menu. */
export function Topbar({ onToggleNav, navExpanded }: TopbarProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data: session } = useMyPermissionsQuery()
  const signOutMutation = useSignOutMutation()

  const name = session ? sessionDisplayName(session) : '—'
  const roleLabel = session ? sessionRoleLabel(session) : ''

  async function handleLogout() {
    setMenuOpen(false)
    // Land on the login screen either way: a failed logout still means this
    // operator is finished at the till, and the cache has already been cleared.
    await signOutMutation.mutateAsync().catch(() => undefined)
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  return (
    <header className="relative z-topbar flex h-15 shrink-0 items-center gap-1.5 bg-card pl-3 pr-4 shadow-[0_1px_0_rgba(46,32,20,.05),0_2px_10px_rgba(46,32,20,.025)]">
      <button
        type="button"
        onClick={onToggleNav}
        aria-label={navExpanded ? 'Collapse navigation' : 'Expand navigation'}
        aria-expanded={navExpanded}
        className="inline-flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-md border-none bg-transparent text-ink-muted transition-[background,color] duration-120 ease-ks hover:bg-hover hover:text-ink-strong"
      >
        <Icon name="list" size={21} />
      </button>

      <div className="flex items-center gap-2.5 pl-1">
        <span className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-primary text-xl font-black leading-none text-white">
          {BRAND_MARK}
        </span>
        <span className="whitespace-nowrap text-xl font-bold tracking-tight text-ink-strong">{APP_NAME}</span>
      </div>

      <div className="flex-1" />

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex h-11 items-center gap-2.5 rounded-lg border border-transparent bg-transparent pl-1.5 pr-2 transition-[background] duration-120 ease-ks hover:bg-hover"
        >
          <Avatar name={name} size="md" />
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span className="whitespace-nowrap text-sm font-semibold text-ink-strong">{name}</span>
            <span className="whitespace-nowrap text-xs text-ink-subtle">{roleLabel}</span>
          </span>
          <Icon name="caret-down" size={14} color="var(--text-subtle)" className={menuOpen ? 'rotate-180 transition-transform duration-140' : 'transition-transform duration-140'} />
        </button>

        {menuOpen && (
          <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-menu w-60 rounded-2xl bg-card p-2 shadow-lg">
            <div className="flex items-center gap-2.75 px-2 pb-2.75 pt-2">
              <Avatar name={name} size="lg" />
              <div className="min-w-0 leading-snug">
                <div className="text-base font-semibold text-ink-strong">{name}</div>
                <div className="text-xs text-ink-subtle">{roleLabel}</div>
              </div>
            </div>
            <div className="mx-0.5 mb-1.5 mt-0.5 h-px bg-stroke-subtle" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={signOutMutation.isPending}
              className="flex w-full items-center gap-2.5 rounded-md border-none bg-transparent px-2 py-2.25 text-left text-base font-medium text-danger transition-[background] duration-120 ease-ks hover:bg-danger-surface"
            >
              {signOutMutation.isPending ? <Spinner size={18} color="var(--color-danger)" /> : <Icon name="sign-out" size={18} />}
              <span>{signOutMutation.isPending ? 'Signing out…' : 'Logout'}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
