import { cn } from "@/src/lib/utils";

/** 12px slot (4px + 1px line + 4px at default rem) inside `px-1` menus. */
export const MENU_DIVIDER_VERTICAL_CLASS = "h-3";

export function MenuDivider({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      className={cn(
        "relative min-w-full shrink-0 self-stretch",
        MENU_DIVIDER_VERTICAL_CLASS,
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute top-1/2 -left-1 -right-1 h-px -translate-y-1/2 bg-[var(--oh-border)]"
      />
    </div>
  );
}
