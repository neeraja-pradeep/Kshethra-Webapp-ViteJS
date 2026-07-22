import { Icon } from './Icon'

interface ComingSoonProps {
  title: string
  desc?: string
}

/** Temporary placeholder for routes whose screen is not yet implemented. */
export function ComingSoon({ title, desc }: ComingSoonProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-xs">
        <Icon name="hammer" size={26} color="var(--text-subtle)" />
      </span>
      <h1 className="m-0 text-2xl font-heading tracking-title text-ink-strong">{title}</h1>
      {desc && <p className="m-0 max-w-md text-sm text-ink-muted">{desc}</p>}
    </div>
  )
}
