import type { ChangeEvent } from 'react'

import { Avatar, Icon, Input, Switch } from '@/shared/ui'
import type { UserStatus } from '@/features/users-roles/domain/entities/user'

export interface UserIdentitySectionProps {
  name: string
  email: string
  phone: string
  avatar: string | null
  status: UserStatus
  errors: { name?: string; email?: string; phone?: string }
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onStatusToggle: () => void
  onPictureSelect: (file: File) => void
  onRemovePicture: () => void
}

/** Add/edit form — identity card: picture, status switch, name, email, phone. */
export function UserIdentitySection({
  name,
  email,
  phone,
  avatar,
  status,
  errors,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onStatusToggle,
  onPictureSelect,
  onRemovePicture,
}: UserIdentitySectionProps) {
  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onPictureSelect(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4.5 rounded-2xl bg-card p-5.5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Identity</div>
          <div className="mt-1 text-2xs text-ink-subtle">Name, contact, and picture.</div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Status</span>
          <Switch checked={status === 'Active'} onChange={onStatusToggle} label={status} />
        </div>
      </div>

      <div className="flex flex-col gap-1.75">
        <span className="text-sm font-medium text-ink">Picture</span>
        <div className="flex items-center gap-3.5">
          <Avatar name={name || 'New user'} src={avatar ?? undefined} size="2xl" />
          {avatar ? (
            <button
              type="button"
              onClick={onRemovePicture}
              className="inline-flex h-8.5 items-center gap-1.75 rounded-md border-none bg-transparent px-3.25 text-sm font-medium text-ink shadow-xs hover:bg-hover"
            >
              <Icon name="trash" size={15} />
              Remove photo
            </button>
          ) : (
            <label className="relative inline-flex h-9.5 cursor-pointer items-center gap-2 rounded-md border-[1.5px] border-dashed border-stroke-strong bg-card px-3.5 text-ink-muted hover:bg-hover hover:text-ink-strong">
              <input type="file" accept="image/*" onChange={handleFile} className="absolute h-0 w-0 opacity-0" />
              <Icon name="upload-simple" size={16} />
              <span className="text-sm font-medium">Upload photo</span>
            </label>
          )}
        </div>
      </div>

      <Input label="Full name" required placeholder="e.g. Ravi Kumar" value={name} onChange={(e) => onNameChange(e.target.value)} error={errors.name} />

      <div className="flex flex-wrap items-start gap-3.5">
        <div className="min-w-0 flex-1 basis-[260px]">
          <Input label="Email" required type="email" placeholder="name@srikshetra.org" value={email} onChange={(e) => onEmailChange(e.target.value)} error={errors.email} />
        </div>
        <div className="min-w-0 flex-1 basis-[200px]">
          <Input label="Phone" required placeholder="+91 98450 00000" value={phone} onChange={(e) => onPhoneChange(e.target.value)} error={errors.phone} />
        </div>
      </div>
    </div>
  )
}
