interface ComposeViewFieldProps {
  label: string
  value: string
}

/** Read-mode field: overline label recedes, the value leads (view-mode pattern). */
export function ComposeViewField({ label, value }: ComposeViewFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">{label}</span>
      <span className="whitespace-pre-wrap text-lg font-medium leading-snug text-ink-strong">{value.trim() ? value : '—'}</span>
    </div>
  )
}
