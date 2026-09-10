import { Alert, Button, Icon, Input, Modal, Switch } from '@/shared/ui'

import {
  RADIUS_DEFAULT_METERS,
  RADIUS_MAX_METERS,
  RADIUS_MIN_METERS,
} from '@/features/temple-locations/domain/entities/temple-location'
import { LocationPickerField } from '@/features/temple-locations/presentation/components/LocationPickerField'
import type {
  TempleLocationFormErrors,
  TempleLocationFormValues,
} from '@/features/temple-locations/presentation/lib/templeLocationDisplay'

export interface TempleLocationFormModalProps {
  open: boolean
  editing: boolean
  values: TempleLocationFormValues
  errors: TempleLocationFormErrors
  /** A server error with no field of its own — a 403, a dropped network. */
  banner?: string | null
  saving: boolean
  onChange: <K extends keyof TempleLocationFormValues>(
    key: K,
    value: TempleLocationFormValues[K],
  ) => void
  onSubmit: () => void
  onClose: () => void
}

export function TempleLocationFormModal({
  open,
  editing,
  values,
  errors,
  banner = null,
  saving,
  onChange,
  onSubmit,
  onClose,
}: TempleLocationFormModalProps) {
  /**
   * The radius field is a string being typed, so it is briefly empty or
   * out of range. The circle falls back to the default rather than vanishing
   * or throwing while somebody clears the box to retype it.
   */
  const typedRadius = Number(values.radiusMeters)
  const mapRadius =
    Number.isFinite(typedRadius) && typedRadius >= RADIUS_MIN_METERS && typedRadius <= RADIUS_MAX_METERS
      ? typedRadius
      : RADIUS_DEFAULT_METERS

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      size="md"
      title={editing ? 'Edit site' : 'Add site'}
      description="Poojaris marking attendance must be inside this circle."
      footer={
        <div className="flex justify-end gap-2">
          <Button theme="default" variant="outline" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button theme="primary" disabled={saving} onClick={onSubmit}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add site'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3.5">
        {banner && (
          <Alert type="danger" icon={<Icon name="warning" size={16} />}>
            {banner}
          </Alert>
        )}

        <Input
          label="Name"
          required
          placeholder="e.g. Main Temple"
          value={values.name}
          error={errors.name}
          disabled={saving}
          onChange={(e) => onChange('name', e.target.value)}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Latitude"
            required
            placeholder="10.123456"
            inputMode="decimal"
            value={values.latitude}
            error={errors.latitude}
            disabled={saving}
            onChange={(e) => onChange('latitude', e.target.value)}
          />
          <Input
            label="Longitude"
            required
            placeholder="76.654321"
            inputMode="decimal"
            value={values.longitude}
            error={errors.longitude}
            disabled={saving}
            onChange={(e) => onChange('longitude', e.target.value)}
          />
        </div>

        {/* The inputs above stay authoritative: this writes into them and reads
            back from them, so typing and clicking are the same operation. */}
        <LocationPickerField
          latitude={values.latitude}
          longitude={values.longitude}
          radiusMeters={mapRadius}
          disabled={saving}
          onPick={(latitude, longitude) => {
            onChange('latitude', latitude)
            onChange('longitude', longitude)
          }}
        />

        {/* Measured from where poojaris actually stand, not the postal centroid. */}
        <Input
          label="Radius"
          required
          type="number"
          min={RADIUS_MIN_METERS}
          max={RADIUS_MAX_METERS}
          suffix="metres"
          value={values.radiusMeters}
          error={errors.radiusMeters}
          disabled={saving}
          hint={`${RADIUS_MIN_METERS}–${RADIUS_MAX_METERS} m. ${RADIUS_DEFAULT_METERS} m suits a typical compound — consumer GPS drifts by tens of metres beside masonry.`}
          onChange={(e) => onChange('radiusMeters', e.target.value)}
        />

        <Switch
          checked={values.isActive}
          disabled={saving}
          label="Active"
          description="Only active sites are used to resolve a poojari's attendance."
          onChange={(e) => onChange('isActive', e.target.checked)}
        />
      </div>
    </Modal>
  )
}
