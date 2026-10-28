const compactNumber = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

interface TokenMeterProps {
  /** Tokens used by the current turn. */
  used: number;
  /** Size of the model's context window, in tokens. */
  limit: number;
  /** Translated label, exposed as the tooltip. */
  title: string;
}

/** Thin bar showing how much of the context window the current turn uses. */
export function TokenMeter({ used, limit, title }: TokenMeterProps) {
  const percent = Math.min(100, Math.max(0, (used / limit) * 100));

  return (
    <span
      data-testid="token-meter"
      title={title}
      className="flex flex-shrink-0 items-center gap-1.5 text-xs tabular-nums text-muted/80"
    >
      <span
        aria-hidden
        className="h-1 w-10 overflow-hidden rounded-full bg-muted/20"
      >
        <span
          data-testid="token-meter-fill"
          className="block h-full rounded-full bg-accent transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </span>
      {compactNumber.format(used)}
    </span>
  );
}
