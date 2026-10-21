import { cn } from "#/utils/utils";

/** Relative widths, so the placeholder reads as ragged lines of output. */
const LINE_WIDTHS = ["w-3/4", "w-full", "w-1/2"];

/**
 * Pulsing placeholder bars shown where output is still arriving. Purely
 * decorative, so it is hidden from assistive technology.
 */
export function SkeletonLines({ className }: { className?: string }) {
  return (
    <div
      data-testid="rail-skeleton"
      aria-hidden
      className={cn("flex flex-col gap-1.5", className)}
    >
      {LINE_WIDTHS.map((width) => (
        <div
          key={width}
          className={cn(
            "h-2 rounded-full bg-muted/20 animate-pulse motion-reduce:animate-none",
            width,
          )}
        />
      ))}
    </div>
  );
}
