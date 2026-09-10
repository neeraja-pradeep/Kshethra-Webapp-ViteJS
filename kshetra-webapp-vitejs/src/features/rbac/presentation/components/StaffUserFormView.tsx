import { useState } from 'react'

import { Alert, Button, Icon, Input, Select, Switch, type SelectOption } from '@/shared/ui'
import type { AssignableBaseRole, RbacUser } from '@/features/rbac/domain/entities/rbac-user'
import { POOJARI_ROLE, type StaffUserFormValues } from '@/features/rbac/presentation/lib/staffUserForm'
import { ScreenTopBar } from '@/features/users-roles/presentation/components/ScreenTopBar'

export interface StaffUserFormViewProps {
  /** null when creating. */
  user: RbacUser | null
  values: StaffUserFormValues
  baseRoles: readonly AssignableBaseRole[]
  baseRolesLoading: boolean
  saving: boolean
  error: string | null
  fieldErrors: Readonly<Record<string, readonly string[]>>
  onChange: (values: StaffUserFormValues) => void
  onCancel: () => void
  onSave: () => void
}

/**
 * Create or edit a staff account.
 *
 * Written against `StaffUserCreateSerializer` / `StaffUserUpdateSerializer`
 * rather than the console's original design, which drew an avatar, a full
 * name, a single role and a poojari-deity picker. Only the name has a backend
 * field, and even that is write-only today — the rest were prototype fiction,
 * so they are not drawn.
 */
export function StaffUserFormView({
  user,
  values,
  baseRoles,
  baseRolesLoading,
  saving,
  error,
  fieldErrors,
  onChange,
  onCancel,
  onSave,
}: StaffUserFormViewProps) {
  const editing = user !== null
  const [touched, setTouched] = useState(false)

  const set = <K extends keyof StaffUserFormValues>(key: K, value: StaffUserFormValues[K]) =>
    onChange({ ...values, [key]: value })

  /** Local rule first, then whatever the server said about the same field. */
  const fieldError = (key: string, wireKey = key): string | undefined => {
    if (touched) {
      if (key === 'username' && !editing && !values.username.trim()) return 'A username is required.'
      if (key === 'password' && !editing && values.password.length < 8) return 'Use at least 8 characters.'
      if (key === 'email' && values.email && !values.email.includes('@')) return 'Enter a valid email address.'
    }
    return fieldErrors[wireKey]?.[0]
  }

  const roleOptions: SelectOption[] = baseRoles.map((role) => ({ value: role.name, label: role.label }))
  const chosenRole = baseRoles.find((role) => role.name === values.role) ?? null

  function handleSave() {
    setTouched(true)
    if (!editing && (!values.username.trim() || values.password.length < 8)) return
    onSave()
  }

  return (
    <div className="absolute inset-0 z-drawer flex flex-col overflow-hidden bg-sunken">
      <ScreenTopBar
        onBack={onCancel}
        crumb="Users"
        title={editing ? user.username : 'New staff account'}
        right={
          <div className="flex items-center gap-2">
            <Button theme="default" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button theme="primary" size="sm" loading={saving} onClick={handleSave}>
              {editing ? 'Save changes' : 'Create account'}
            </Button>
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto px-7 py-5">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          {error && <Alert type="danger">{error}</Alert>}

          <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-xs">
            <h2 className="m-0 text-sm font-semibold text-ink-strong">Sign-in</h2>

            {editing ? (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-ink-strong">Username</span>
                <div className="flex h-8 items-center gap-1.5 rounded-lg bg-sunken px-2.5">
                  <Icon name="lock-simple" size={14} />
                  <span className="text-sm text-ink">{user.username}</span>
                </div>
                <span className="text-xs text-ink-subtle">
                  Permanent — it is the sign-in identifier and appears in the audit trail.
                </span>
              </div>
            ) : (
              <>
                <Input
                  label="Username"
                  required
                  value={values.username}
                  disabled={saving}
                  onChange={(e) => set('username', e.target.value)}
                  onBlur={() => setTouched(true)}
                  hint="Cannot be changed once the account exists."
                  error={fieldError('username')}
                />
                <Input
                  label="Password"
                  required
                  type="password"
                  value={values.password}
                  disabled={saving}
                  onChange={(e) => set('password', e.target.value)}
                  onBlur={() => setTouched(true)}
                  hint="Checked against the server's password rules."
                  error={fieldError('password')}
                />
              </>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-xs">
            <h2 className="m-0 text-sm font-semibold text-ink-strong">Contact</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="First name"
                value={values.firstName}
                disabled={saving}
                onChange={(e) => set('firstName', e.target.value)}
                error={fieldError('firstName', 'first_name')}
              />
              <Input
                label="Last name"
                value={values.lastName}
                disabled={saving}
                onChange={(e) => set('lastName', e.target.value)}
                error={fieldError('lastName', 'last_name')}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={values.email}
                disabled={saving}
                onChange={(e) => set('email', e.target.value)}
                error={fieldError('email')}
              />
              <Input
                label="Phone"
                value={values.phoneNumber}
                disabled={saving}
                onChange={(e) => set('phoneNumber', e.target.value)}
                hint="Must be unique across accounts."
                error={fieldError('phoneNumber', 'phone_number')}
              />
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-xs">
            <h2 className="m-0 text-sm font-semibold text-ink-strong">Base role</h2>
            <Select
              options={roleOptions}
              value={values.role}
              disabled={saving || baseRolesLoading}
              onChange={(e) => set('role', e.target.value)}
            />
            {chosenRole?.description && <p className="m-0 text-xs text-ink-subtle">{chosenRole.description}</p>}
            <p className="m-0 text-xs leading-snug text-ink-subtle">
              The base role decides which sign-in endpoint accepts this account. Saving it grants the new role's
              permissions and revokes the previous one's — it is not additive. Custom roles are layered on top from the
              user's detail screen.
            </p>

            {values.role === POOJARI_ROLE && !editing && (
              <Input
                label="Employee id"
                value={values.employeeId}
                disabled={saving}
                onChange={(e) => set('employeeId', e.target.value)}
                hint="Poojari accounts only. Generated when left blank."
                error={fieldError('employeeId', 'employee_id')}
              />
            )}

            <Switch
              checked={values.isActive}
              disabled={saving}
              onChange={(e) => set('isActive', e.target.checked)}
              label="Active"
              description="An inactive account cannot sign in."
            />
          </section>
        </div>
      </div>
    </div>
  )
}
