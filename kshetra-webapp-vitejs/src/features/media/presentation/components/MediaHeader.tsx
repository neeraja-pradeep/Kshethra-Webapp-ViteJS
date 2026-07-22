import { Button, Icon } from '@/shared/ui'

interface MediaHeaderProps {
  onAddTrack: () => void
}

/** Page title + subtitle, and the primary "Add track" action. */
export function MediaHeader({ onAddTrack }: MediaHeaderProps) {
  return (
    <div className="flex flex-shrink-0 items-start gap-4 px-7 pb-3.5 pt-6">
      <div className="min-w-0 flex-1">
        <h1 className="m-0 text-3xl font-heading leading-tight tracking-title text-ink-strong">Media</h1>
        <p className="m-0 mt-1.5 text-sm text-ink-muted">Audio tracks served in the devotee app.</p>
      </div>
      <Button theme="primary" iconLeft={<Icon name="plus" size={16} />} onClick={onAddTrack}>
        Add track
      </Button>
    </div>
  )
}
