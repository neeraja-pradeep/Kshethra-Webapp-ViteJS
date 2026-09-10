import { Alert, Icon } from '@/shared/ui'

import type { GeofenceReadiness } from '@/features/temple-locations/domain/entities/temple-location'

/**
 * What the current configuration means for attendance.
 *
 * This is the screen's reason for existing beyond CRUD. The resolution rules
 * have a trap in them: **the moment a second site goes active, every poojari
 * who is not explicitly assigned to one stops being able to mark** — and there
 * is no REST endpoint to assign them, only Django admin. Nothing else on the
 * page would tell an operator that they had just broken attendance.
 */
export function GeofenceReadinessBanner({ readiness }: { readiness: GeofenceReadiness }) {
  if (readiness.kind === 'ready') {
    return (
      <Alert type="success" icon={<Icon name="check-circle" size={16} />}>
        <span>
          Attendance resolves to <strong>{readiness.site.name}</strong>. A single active site needs
          no per-poojari assignment.
        </span>
      </Alert>
    )
  }

  if (readiness.kind === 'none') {
    return (
      <Alert type="warning" icon={<Icon name="warning" size={16} />} title="No active site">
        Every same-day present mark is refused while no site is active. Activate one, or add the
        temple&rsquo;s premises below.
      </Alert>
    )
  }

  return (
    <Alert
      type="warning"
      icon={<Icon name="warning" size={16} />}
      title={`${readiness.count} active sites`}
    >
      With more than one active site the server will not guess where somebody works: only poojaris
      explicitly assigned to a site can mark. Assignment is not exposed by the API yet — it is set
      in Django admin under Poojari profiles. Deactivate all but one to return to the simple case.
    </Alert>
  )
}
