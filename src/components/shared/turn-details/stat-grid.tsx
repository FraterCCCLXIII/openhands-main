/** Label and value pairs in a compact grid. */
export function StatGrid({
  stats,
}: {
  stats: { label: string; value: string }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 @sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0">
          <dt className="truncate text-xs uppercase tracking-wider text-muted">
            {stat.label}
          </dt>
          <dd className="truncate font-mono text-xs tabular-nums text-foreground">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
