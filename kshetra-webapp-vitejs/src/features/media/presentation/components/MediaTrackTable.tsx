import type { ReactNode } from 'react'

import { Icon, Switch, Table } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import type { MediaTrack } from '@/features/media/domain/entities/media-track'
import { formatPlayCount } from '@/features/media/presentation/lib/media-format'

import { SortableColumnHeader } from './SortableColumnHeader'
import { TrackThumbnail } from './TrackThumbnail'

export type MediaSortKey = 'title' | 'homescreen' | 'plays' | 'status'

interface MediaTrackTableProps {
  rows: MediaTrack[]
  sortKey: MediaSortKey | null
  sortDir: 'asc' | 'desc'
  onSort: (key: MediaSortKey) => void
  onRowClick: (track: MediaTrack) => void
  onToggleStatus: (track: MediaTrack) => void
  empty: ReactNode
}

/** The media library table: track (thumb + title/artist), home-screen flag, plays, status. */
export function MediaTrackTable({ rows, sortKey, sortDir, onSort, onRowClick, onToggleStatus, empty }: MediaTrackTableProps) {
  const columns: TableColumn<MediaTrack>[] = [
    {
      key: 'title',
      header: <SortableColumnHeader label="Track" sortKey="title" activeKey={sortKey} direction={sortDir} onSort={onSort} />,
      render: (_value, row) => (
        <div className="flex min-w-0 items-center gap-2.75">
          <TrackThumbnail id={row.id} title={row.title} cover={row.cover} />
          <div className="flex min-w-0 flex-col gap-px">
            <span className="truncate font-medium text-ink-strong">{row.title}</span>
            <span className="text-xs text-ink-subtle">{row.artist}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'homescreen',
      header: <SortableColumnHeader label="Home screen" sortKey="homescreen" activeKey={sortKey} direction={sortDir} onSort={onSort} />,
      render: (_value, row) =>
        row.homescreen ? (
          <span className="inline-flex items-center gap-1.25 text-primary">
            <Icon name="house" weight="fill" size={14} />
            Featured
          </span>
        ) : (
          <span className="text-ink-disabled">—</span>
        ),
    },
    {
      key: 'plays',
      header: <SortableColumnHeader label="Plays" sortKey="plays" activeKey={sortKey} direction={sortDir} onSort={onSort} />,
      align: 'right',
      render: (_value, row) => (
        <span className={cn('tabular-nums', row.plays == null ? 'text-ink-disabled' : 'text-ink')}>{formatPlayCount(row.plays)}</span>
      ),
    },
    {
      key: 'status',
      header: <SortableColumnHeader label="Status" sortKey="status" activeKey={sortKey} direction={sortDir} onSort={onSort} />,
      render: (_value, row) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-2">
          <Switch checked={row.status === 'Active'} size="sm" onChange={() => onToggleStatus(row)} />
          <span className={cn('text-xs', row.status === 'Active' ? 'text-success' : 'text-ink-subtle')} style={{ minWidth: 50 }}>
            {row.status}
          </span>
        </span>
      ),
    },
  ]

  return <Table columns={columns} rows={rows} onRowClick={onRowClick} empty={empty} />
}
