import { cn } from "#/utils/utils";

/**
 * Disclosure caret. Points right while collapsed and rotates to point down
 * when expanded, so the open and close states share one animated icon. It is
 * a thin stroked chevron, so it reads lighter than the solid arrow it replaced.
 */
export function ExpandChevron({
  expanded,
  className,
}: {
  expanded: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "flex-shrink-0 text-muted transition-transform duration-200 motion-reduce:transition-none",
        expanded ? "rotate-0" : "-rotate-90",
        className,
        // Last, so a caller's fill-* class cannot turn the stroke into a solid shape.
        "fill-none",
      )}
    >
      <path d="M4 6.5 8 10.5 12 6.5" />
    </svg>
  );
}
