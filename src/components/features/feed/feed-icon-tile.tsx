import type { ReactNode } from "react";
import { cn } from "#/utils/utils";

/** A rounded, tinted tile behind an icon, sized by the list row that holds it. */
export function FeedIconTile({
  className,
  children,
}: {
  /** Tailwind classes for the tile's tint and glyph color. */
  className: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex size-full items-center justify-center rounded-xl",
        className,
      )}
    >
      {children}
    </span>
  );
}
