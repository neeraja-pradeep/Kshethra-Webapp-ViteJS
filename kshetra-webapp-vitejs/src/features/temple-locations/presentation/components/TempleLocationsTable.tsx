import type { ReactNode } from 'react'

import { Badge, Icon, IconButton, Switch, Table, type TableColumn } from '@/shared/ui'

import type { TempleLocation } from '@/features/temple-locations/domain/entities/temple-location'
import {
  formatCoordinates,
  formatRadius,
  mapsUrl,
  statusBadge,
} from '@/features/temple-locations/presentation/lib/templeLocationDisplay'

export interface TempleLocationsTableProps {
  rows: readonly TempleLocation[]
  canWrite: boolean
  canDelete: boolean
  onRowClick: (row: TempleLocation) => void
  onToggleActive: (row: TempleLocation) => void
  onDelete: (row: TempleLocation) => void
  empty: ReactNode
}

export function TempleLocationsTable({
  rows,
  canWrite,
  canDelete,
  onRowClick,
  onToggleActive,
  onDelete,
  empty,
}: TempleLocationsTableProps) {
  const columns: TableColumn<TempleLocation>[] = [
    {
      key: 'name',
      header: 'Site',
      render: (_value, row) => (
        <div className="flex items-center gap-2.75 py-0.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
            <Icon name="map-pin" size={16} />
          </span>
          <span className="font-medium text-ink-strong">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'coordinates',
      header: 'Coordinates',
      render: (_value, row) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="tabular-nums text-ink">{formatCoordinates(row.latitude, row.longitude)}</span>
          {/* Opening the pin is the only way to check it is the right courtyard. */}
          <a
            href={mapsUrl(row.latitude, row.longitude)}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            title="Open in Google Maps"
            className="inline-flex text-ink-subtle hover:text-primary"
          >
            <Icon name="arrow-square-out" size={14} />
          </a>
        </span>
      ),
    },
    {
      key: 'radiusMeters',
      header: 'Radius',
      align: 'right',
      render: (_value, row) => <span className="tabular-nums text-ink">{formatRadius(row.radiusMeters)}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      width: 150,
      render: (_value, row) => {
        const badge = statusBadge(row.isActive)
        return (
          <span className="inline-flex items-center gap-2.5">
            {canWrite ? (
              /* Stops the row's own click from opening the editor behind the switch. */
              <span onClick={(e) => e.stopPropagation()} className="inline-flex">
                <Switch
                  checked={row.isActive}
                  size="sm"
                  onChange={() => onToggleActive(row)}
                  aria-label={`${row.isActive ? 'Deactivate' : 'Activate'} ${row.name}`}
                />
              </span>
            ) : null}
            <Badge color={badge.color} size="sm">
              {badge.label}
            </Badge>
          </span>
        )
      },
    },
  ]

  /* Only drawn for a role that may actually delete — the column disappears
     entirely rather than showing a button the API would refuse. */
  if (canDelete) {
    columns.push({
      key: 'actions',
      header: '',
      width: 56,
      align: 'right',
      render: (_value, row) => (
        /* Stops the row's own click from opening the editor behind the button. */
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <IconButton
            label={`Delete ${row.name}`}
            theme="danger"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row)}
          >
            <Icon name="trash" size={15} />
          </IconButton>
        </span>
      ),
    })
  }

  return <Table columns={columns} rows={rows} onRowClick={onRowClick} empty={empty} />
}
