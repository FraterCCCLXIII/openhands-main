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
        "flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-muted hover:text-contrast active:cursor-grabbing",
        className,
      )}
      {...props}
    >
      <GripVertical aria-hidden className="size-4" />
    </button>
  );
}
