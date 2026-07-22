import { Alert, Button, Icon, type SelectOption } from '@/shared/ui'
import type { God } from '@/features/users-roles/domain/entities/god'
import type { Role } from '@/features/users-roles/domain/entities/role'
import type { UserStatus } from '@/features/users-roles/domain/entities/user'
import { PoojariGodsSection } from '@/features/users-roles/presentation/components/PoojariGodsSection'
import { ScreenTopBar } from '@/features/users-roles/presentation/components/ScreenTopBar'
import { UserIdentitySection } from '@/features/users-roles/presentation/components/UserIdentitySection'
import { UserRoleSection } from '@/features/users-roles/presentation/components/UserRoleSection'

export interface UserFormValues {
  name: string
  email: string
  phone: string
  avatar: string | null
  roleId: string
  status: UserStatus
  gods: readonly string[]
}

export interface UserFormErrors {
  name?: string
  email?: string
  phone?: string
  roleId?: string
}

export interface UserFormViewProps {
  title: string
  saveLabel: string
  values: UserFormValues
  errors: UserFormErrors
  roleOptions: readonly SelectOption[]
  chosenRole: Role | null
  gods: readonly God[]
  godPickerOpen: boolean
  onCancel: () => void
  onSave: () => void
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onStatusToggle: () => void
  onPictureSelect: (file: File) => void
  onRemovePicture: () => void
  onRoleChange: (roleId: string) => void
  onToggleGodPicker: () => void
  onCloseGodPicker: () => void
  onToggleGod: (godId: string) => void
  onRemoveGod: (godId: string) => void
}

/** Add/edit user overlay: identity, role, poojari-only gods, and the login-allowlist note. */
export function UserFormView({
  title,
  saveLabel,
  values,
  errors,
  roleOptions,
  chosenRole,
  gods,
  godPickerOpen,
  onCancel,
  onSave,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onStatusToggle,
  onPictureSelect,
  onRemovePicture,
  onRoleChange,
  onToggleGodPicker,
  onCloseGodPicker,
  onToggleGod,
  onRemoveGod,
}: UserFormViewProps) {
  const isPoojari = chosenRole?.kind === 'poojari'

  return (
    <div className="absolute inset-0 z-drawer flex flex-col bg-sunken">
      <ScreenTopBar
        onBack={onCancel}
        crumb="Users & Roles"
        title={title}
        right={
          <>
            <Button theme="default" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button theme="primary" onClick={onSave}>
              {saveLabel}
            </Button>
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-6 pb-14 pt-6">
          <UserIdentitySection
            name={values.name}
            email={values.email}
            phone={values.phone}
            avatar={values.avatar}
            status={values.status}
            errors={errors}
            onNameChange={onNameChange}
            onEmailChange={onEmailChange}
            onPhoneChange={onPhoneChange}
            onStatusToggle={onStatusToggle}
            onPictureSelect={onPictureSelect}
            onRemovePicture={onRemovePicture}
          />

          <UserRoleSection roleOptions={roleOptions} roleId={values.roleId} error={errors.roleId} chosenRole={chosenRole} onRoleChange={onRoleChange} />

          {isPoojari && (
            <PoojariGodsSection
              gods={gods}
              selectedIds={values.gods}
              pickerOpen={godPickerOpen}
              onTogglePicker={onToggleGodPicker}
              onClosePicker={onCloseGodPicker}
              onToggleGod={onToggleGod}
              onRemoveGod={onRemoveGod}
            />
          )}

          <Alert type="info" icon={<Icon name="info" size={16} />}>
            Email and phone form the login allowlist — only users listed here can sign in. Login credentials are set up separately.
          </Alert>
        </div>
      </div>
    </div>
  )
}
