import { cn } from "#/utils/utils";

/** Label and value pairs in one row that never wraps: it scrolls sideways when it must. */
export function StatGrid({
  stats,
}: {
  stats: { label: string; value: string; end?: boolean }[];
}) {
  return (
    <dl className="custom-scrollbar flex flex-nowrap gap-x-6 overflow-x-auto">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn("shrink-0", stat.end && "ml-auto text-right")}
        >
          <dt className="whitespace-nowrap text-xs uppercase tracking-wider text-muted">
            {stat.label}
          </dt>
          <dd className="whitespace-nowrap font-mono text-xs tabular-nums text-foreground">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
