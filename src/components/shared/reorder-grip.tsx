import React from "react";
import { GripVertical } from "lucide-react";
import { cn } from "#/utils/utils";

interface ReorderGripProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name, such as "Reorder: Pinned automations". */
  label: string;
}

/** Drag handle shared by every reorderable list. Pass `useReorderDrag` props. */
export function ReorderGrip({ label, className, ...props }: ReorderGripProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex h-6 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted opacity-60 transition-opacity hover:bg-interactive-hover hover:text-contrast hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <GripVertical aria-hidden className="size-3.5" />
    </button>
  );
}
