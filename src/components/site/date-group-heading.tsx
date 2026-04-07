export function DateGroupHeading({
  label,
  count,
}: {
  label: string
  count: number
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-4">
      <div className="flex items-center gap-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          {label}
        </h2>
        <span className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground sm:hidden">
          {count.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="hidden font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground sm:block">
        {count.toString().padStart(2, "0")} items
      </div>
    </div>
  )
}
