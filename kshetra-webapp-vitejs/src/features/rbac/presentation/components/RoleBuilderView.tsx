import { useMemo, useState } from 'react'

import { Alert, Badge, Button, Icon, Input, Modal, Spinner, Switch, Tabs, Textarea } from '@/shared/ui'
import type { PermissionCatalogue } from '@/features/rbac/domain/entities/permission'
import type { RbacRole } from '@/features/rbac/domain/entities/rbac-role'
import { ADMIN_PORTAL_PERMISSION, isValidRoleName, missingAdminPortal } from '@/features/rbac/domain/entities/rbac-role'
import {
  allCapabilityKeys,
  findModule,
  MAPPED_PERMISSIONS,
  moduleCodenames,
  resolveModules,
  silentlyRevoked,
} from '@/features/rbac/domain/entities/module-map'
import { ModuleCapabilityGrid } from '@/features/rbac/presentation/components/ModuleCapabilityGrid'
import { PermissionCatalogueView } from '@/features/rbac/presentation/components/PermissionCatalogueView'
import { buildPermissionIndex, dangerousIn, permissionName, unknownCodenames } from '@/features/rbac/presentation/lib/permissionLookup'
import { useRoleDraft } from '@/features/rbac/presentation/lib/useRoleDraft'
import { ScreenTopBar } from '@/features/users-roles/presentation/components/ScreenTopBar'

export interface RoleBuilderViewProps {
  /** null when creating. */
  role: RbacRole | null
  catalogue: PermissionCatalogue
  saving: boolean
  error: string | null
  onCancel: () => void
  /** Assignment is `assign_roles` — available even when editing is not. */
  onManageMembers: () => void
  /** Absent when the operator may not delete, or the role is built-in. */
  onDelete: (() => void) | null
  onSave: (input: {
    name: string
    label: string
    description: string
    isActive: boolean
    permissions: readonly string[]
  }) => void
}

const NAME_HINT = 'Lowercase letters, numbers and underscores. Permanent — only the display name can be changed later.'

/**
 * Create or edit a role by picking product capabilities.
 *
 * The save body is recomputed from scratch every time, as the union of what
 * the ticked capabilities require and what the role held outside the module
 * view. `PATCH permissions` replaces rather than merges, so anything left out
 * of that union is revoked — which is why nothing here ever edits a permission
 * array in place.
 */
export function RoleBuilderView({ role, catalogue, saving, error, onCancel, onManageMembers, onDelete, onSave }: RoleBuilderViewProps) {
  const editing = role !== null
  const locked = editing && (role.isSystem || !role.isEditable)

  const { draft, permissions, isDirty, lastToggleIneffective, setField, toggle, setModule, setExtra } = useRoleDraft(role)
  const [tab, setTab] = useState<'modules' | 'all'>('modules')
  const [nameTouched, setNameTouched] = useState(false)
  const [pendingDanger, setPendingDanger] = useState<PendingGrant | null>(null)
  const [confirmSave, setConfirmSave] = useState(false)

  const index = useMemo(() => buildPermissionIndex(catalogue), [catalogue])
  const resolved = useMemo(() => resolveModules(permissions), [permissions])
  const dangerous = useMemo(() => dangerousIn(permissions, index), [permissions, index])

  /**
   * Codenames the role holds that this save would drop without being asked to.
   * Should always be empty — a non-empty list means the map and the round trip
   * disagree, so the save is blocked rather than sent.
   */
  const wouldSilentlyRevoke = useMemo(
    () => (role && !isDirty ? silentlyRevoked(role.permissions, permissions) : []),
    [role, isDirty, permissions],
  )

  /** Map codenames the live catalogue has never heard of — a transcription error. */
  const unknown = useMemo(() => unknownCodenames(MAPPED_PERMISSIONS, index), [index])

  const nameError = nameTouched && !editing && draft.name !== '' && !isValidRoleName(draft.name)
    ? 'Use lowercase letters, numbers and underscores, starting with a letter.'
    : undefined
  const canSave = !saving && !locked && draft.label.trim() !== '' &&
    (editing || (draft.name !== '' && isValidRoleName(draft.name))) &&
    wouldSilentlyRevoke.length === 0

  /** The dangerous codenames a grant would newly introduce. Empty means go ahead. */
  function newlyDangerous(codenames: readonly string[]): readonly string[] {
    return dangerousIn(codenames.filter((codename) => !permissions.includes(codename)), index).map((p) => p.value)
  }

  function handleToggle(moduleKey: string, capabilityKey: string) {
    if (resolved[moduleKey]?.[capabilityKey] === true) {
      toggle(moduleKey, capabilityKey)
      return
    }
    // Confirm dangerous grants at the moment of the tick, in context, rather
    // than deferring to save where the connection to the checkbox is lost.
    const warn = newlyDangerous(resolveCapability(moduleKey, capabilityKey) ?? [])
    if (warn.length > 0) {
      setPendingDanger({ kind: 'capability', moduleKey, capabilityKey, codenames: warn })
      return
    }
    toggle(moduleKey, capabilityKey)
  }

  /**
   * Whole-module grant.
   *
   * Clearing needs no confirmation, but selecting all runs through the same
   * dangerous check as a single tick — a module-wide grant is the easiest way
   * to hand out `access_all_objects` without noticing.
   */
  function handleSelectAll(moduleKey: string, selectAll: boolean) {
    if (!selectAll) {
      setModule(moduleKey, [])
      return
    }
    const warn = newlyDangerous(moduleCodenames(moduleKey))
    if (warn.length > 0) {
      setPendingDanger({ kind: 'module', moduleKey, codenames: warn })
      return
    }
    setModule(moduleKey, allCapabilityKeys(moduleKey))
  }

  function handleToggleExtra(codename: string, held: boolean) {
    if (held && index.get(codename)?.isDangerous) {
      setPendingDanger({ kind: 'extra', codename, codenames: [codename] })
      return
    }
    setExtra(codename, held)
  }

  function confirmDanger() {
    if (!pendingDanger) return
    if (pendingDanger.kind === 'extra') setExtra(pendingDanger.codename, true)
    else if (pendingDanger.kind === 'module') setModule(pendingDanger.moduleKey, allCapabilityKeys(pendingDanger.moduleKey))
    else toggle(pendingDanger.moduleKey, pendingDanger.capabilityKey)
    setPendingDanger(null)
  }

  function submit() {
    onSave({
      name: draft.name,
      label: draft.label.trim(),
      description: draft.description.trim(),
      isActive: draft.isActive,
      permissions,
    })
  }

  const revokedFromRole = role ? silentlyRevoked(role.permissions, permissions) : []
  const grantedOverRole = role ? permissions.filter((p) => !role.permissions.includes(p)) : permissions

  return (
    <div className="absolute inset-0 z-drawer flex flex-col overflow-hidden bg-sunken">
      <ScreenTopBar
        onBack={onCancel}
        crumb="Roles"
        title={editing ? role.label : 'New role'}
        right={
          <div className="flex items-center gap-2">
            {editing && (
              <Button
                theme="default"
                variant="ghost"
                size="sm"
                iconLeft={<Icon name="users-three" size={15} />}
                onClick={onManageMembers}
                disabled={saving}
              >
                {role.userCount} {role.userCount === 1 ? 'holder' : 'holders'}
              </Button>
            )}
            {onDelete && (
              <Button theme="danger" variant="ghost" size="sm" onClick={onDelete} disabled={saving}>
                Delete
              </Button>
            )}
            <Button theme="default" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button
              theme="primary"
              size="sm"
              loading={saving}
              disabled={!canSave || !isDirty}
              onClick={() => (revokedFromRole.length > 0 ? setConfirmSave(true) : submit())}
            >
              {editing ? 'Save changes' : 'Create role'}
            </Button>
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto px-7 py-5">
        <div className="mx-auto flex max-w-[900px] flex-col gap-4">
          {locked && (
            <Alert type="info" title="Built-in role">
              {role.label} is defined in code, so it cannot be edited here. Change it in the backend’s
              <span className="font-mono"> rbac/roles.py </span> and run <span className="font-mono">manage.py sync_rbac</span>.
            </Alert>
          )}

          {error && <Alert type="danger">{error}</Alert>}

          {wouldSilentlyRevoke.length > 0 && (
            <Alert type="danger" title="Saving is blocked">
              Opening this role and saving it unchanged would drop {wouldSilentlyRevoke.length} permission
              {wouldSilentlyRevoke.length === 1 ? '' : 's'} it currently holds. That is a bug in the module map, not a
              choice you made, so the save is disabled rather than sent:{' '}
              <span className="font-mono text-xs">{wouldSilentlyRevoke.join(', ')}</span>
            </Alert>
          )}

          {import.meta.env.DEV && unknown.length > 0 && (
            <Alert type="warning" title="Module map names permissions the server does not have">
              These would be rejected as a whole-request <span className="font-mono">400</span> on save:{' '}
              <span className="font-mono text-xs">{unknown.join(', ')}</span>
            </Alert>
          )}

          {lastToggleIneffective && (
            <Alert type="info">
              That capability is still granted — another ticked capability requires the same permissions. Untick that one
              too to remove it.
            </Alert>
          )}

          {missingAdminPortal(permissions) && (
            <Alert
              type="warning"
              title="This role cannot sign in"
              actions={
                <Button theme="default" variant="outline" size="sm" onClick={() => setExtra(ADMIN_PORTAL_PERMISSION, true)}>
                  Add sign-in permission
                </Button>
              }
            >
              It grants back-office permissions but not <span className="font-mono">{ADMIN_PORTAL_PERMISSION}</span>, so
              holders are refused at login with everything else correct.
            </Alert>
          )}

          <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-xs">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Display name"
                required
                value={draft.label}
                disabled={locked || saving}
                onChange={(e) => setField('label', e.target.value)}
                placeholder="Counter Lead"
                hint="Shown everywhere in the console. Can be renamed later."
              />
              {editing ? (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-ink-strong">Identifier</span>
                  <div className="flex h-8 items-center gap-1.5 rounded-lg bg-sunken px-2.5">
                    <Icon name="lock-simple" size={14} />
                    <span className="font-mono text-sm text-ink">{role.name}</span>
                  </div>
                  <span className="text-xs text-ink-subtle">Permanent — fixed when the role was created.</span>
                </div>
              ) : (
                <Input
                  label="Identifier"
                  required
                  value={draft.name}
                  disabled={saving}
                  onChange={(e) => setField('name', e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  placeholder="counter_lead"
                  hint={NAME_HINT}
                  error={nameError}
                />
              )}
            </div>

            <Textarea
              label="Description"
              rows={2}
              value={draft.description}
              disabled={locked || saving}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Runs the counter desk and may void a sale."
            />

            <Switch
              checked={draft.isActive}
              disabled={locked || saving}
              onChange={(e) => setField('isActive', e.target.checked)}
              label="Active"
              description="An inactive role keeps its permissions but cannot be assigned to anyone."
            />
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              variant="pill"
              size="sm"
              value={tab}
              onChange={(id) => setTab(id as 'modules' | 'all')}
              items={[
                { id: 'modules', label: 'Modules' },
                { id: 'all', label: `All permissions (${catalogue.count})` },
              ]}
            />
            <span className="text-sm text-ink-subtle">
              {permissions.length} permission{permissions.length === 1 ? '' : 's'} will be saved
            </span>
            {dangerous.length > 0 && (
              <Badge color="red" size="sm" icon={<Icon name="warning" size={11} />}>
                {dangerous.length} dangerous
              </Badge>
            )}
          </div>

          {draft.extras.length > 0 && (
            <Alert type="info" title={`${draft.extras.length} granted outside the module editor`}>
              These are kept when you save. The modules above cannot express them — review or remove them under
              “All permissions”.
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {draft.extras.map((codename) => (
                  <span key={codename} className="rounded-md bg-sunken px-2 py-0.5 font-mono text-2xs text-ink">
                    {codename}
                  </span>
                ))}
              </div>
            </Alert>
          )}

          {tab === 'modules' ? (
            <ModuleCapabilityGrid
              resolved={resolved}
              selection={draft.selection}
              index={index}
              disabled={locked || saving}
              onToggle={handleToggle}
              onSelectAll={handleSelectAll}
            />
          ) : (
            <PermissionCatalogueView
              catalogue={catalogue}
              selection={draft.selection}
              extras={draft.extras}
              disabled={locked || saving}
              onToggleExtra={handleToggleExtra}
            />
          )}
        </div>
      </div>

      <Modal
        open={pendingDanger !== null}
        onClose={() => setPendingDanger(null)}
        title={
          pendingDanger?.kind === 'module'
            ? `Grant all of ${findModule(pendingDanger.moduleKey)?.label ?? 'this module'}?`
            : 'Grant a dangerous permission?'
        }
        size="sm"
        footer={
          <>
            <Button theme="default" variant="outline" onClick={() => setPendingDanger(null)}>
              Cancel
            </Button>
            <Button theme="danger" onClick={confirmDanger}>
              Grant anyway
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2.5">
          {(pendingDanger?.codenames ?? []).map((codename) => (
            <div key={codename} className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink-strong">{permissionName(codename, index)}</span>
              <span className="font-mono text-2xs text-ink-subtle">{codename}</span>
              {/* The server's own wording — it explains the blast radius better than we could. */}
              {index.get(codename)?.warning && (
                <p className="m-0 text-sm leading-normal text-ink-muted">{index.get(codename)?.warning}</p>
              )}
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        title="This removes permissions"
        size="sm"
        footer={
          <>
            <Button theme="default" variant="outline" onClick={() => setConfirmSave(false)}>
              Back
            </Button>
            <Button theme="danger" onClick={() => { setConfirmSave(false); submit() }}>
              Save anyway
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm leading-normal text-ink-muted">
            Everyone holding {role?.label} loses {revokedFromRole.length} permission
            {revokedFromRole.length === 1 ? '' : 's'} on their next request.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {revokedFromRole.map((codename) => (
              <span key={codename} className="rounded-md bg-danger-surface px-2 py-0.5 font-mono text-2xs text-danger-strong">
                {codename}
              </span>
            ))}
          </div>
          {grantedOverRole.length > 0 && (
            <p className="m-0 text-sm text-ink-subtle">And {grantedOverRole.length} added.</p>
          )}
        </div>
      </Modal>

      {saving && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-overlay">
          <Spinner size={32} />
        </div>
      )}
    </div>
  )
}

/** A grant awaiting confirmation, and the dangerous codenames it would add. */
type PendingGrant =
  | { readonly kind: 'capability'; readonly moduleKey: string; readonly capabilityKey: string; readonly codenames: readonly string[] }
  | { readonly kind: 'module'; readonly moduleKey: string; readonly codenames: readonly string[] }
  | { readonly kind: 'extra'; readonly codename: string; readonly codenames: readonly string[] }

/** The codenames one capability requires, or null when the key is unknown. */
function resolveCapability(moduleKey: string, capabilityKey: string): readonly string[] | null {
  return findModule(moduleKey)?.capabilities.find((capability) => capability.key === capabilityKey)?.permissions ?? null
}
