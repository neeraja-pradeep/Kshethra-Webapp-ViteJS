import { avatarColorFor, initialsFor } from '@/features/media/presentation/lib/media-format'

interface TrackThumbnailProps {
  id: string
  title: string
  cover: string | null
}

/** 34px table-row thumbnail: cover art if uploaded, else a coloured initials tile. */
export function TrackThumbnail({ id, title, cover }: TrackThumbnailProps) {
  if (cover) {
    return <span aria-hidden className="inline-block h-8.5 w-8.5 shrink-0 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }} />
  }
  return (
    <span
      className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
      style={{ backgroundColor: avatarColorFor(id) }}
    >
      {initialsFor(title)}
    </span>
  )
}
