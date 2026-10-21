import { cn } from "#/utils/utils";

/**
 * Keyboard shortcut chip shown on the right of a button. A rounded square
 * with a dark translucent fill, uppercase text.
 */
export function HotkeyBadge({
  hotkey,
  className,
}: {
  hotkey: string;
  className?: string;
}) {
  return (
    <kbd
      aria-hidden
      className={cn(
        "ml-auto inline-flex shrink-0 items-center justify-center rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-[0.12em] text-current opacity-70",
        className,
      )}
    >
      {hotkey}
    </kbd>
  );
}
