/** Bottom bar of the auth card — brand line + legal links, wraps gracefully. */
export function AuthFooter() {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t-[0.5px] border-stroke-subtle pt-5.5 text-xs text-ink-subtle">
      <span>Sree Nagaraja Kshetram</span>
      <span className="flex flex-wrap gap-4">
        <button type="button" className="cursor-pointer border-none bg-transparent p-0 text-xs text-ink-subtle">
          Terms
        </button>
        <button type="button" className="cursor-pointer border-none bg-transparent p-0 text-xs text-ink-subtle">
          Privacy
        </button>
        <button type="button" className="cursor-pointer border-none bg-transparent p-0 text-xs text-ink-subtle">
          Help
        </button>
      </span>
    </div>
  )
}
