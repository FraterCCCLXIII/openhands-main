import type { ReactNode } from "react";
import { cn } from "#/utils/utils";

/**
 * Accordion region. The grid row animates between 0fr and 1fr, so the content
 * below it moves down as it opens and up as it closes. The children stay
 * mounted, and the region is inert while closed so hidden controls cannot
 * take focus.
 */
export function AnimatedCollapse({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        className,
      )}
    >
      <div inert={!open} className="relative min-h-0 overflow-hidden">
        {children}
        {/* Fades the bottom edge of the content while it is still being
            revealed, then fades away once the region is fully open. */}
        <div
          aria-hidden
          data-testid="animated-collapse-fade"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-background to-transparent transition-opacity duration-300 motion-reduce:transition-none",
            open ? "opacity-0" : "opacity-100",
          )}
        />
      </div>
    </div>
  );
}
