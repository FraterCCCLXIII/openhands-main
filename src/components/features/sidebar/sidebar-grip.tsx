import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

interface SidebarGripProps {
  /** How many rows show now. */
  shown: number;
  /** How many rows there are. */
  total: number;
  /** What a plain click collapses to. */
  collapsedCount: number;
  /** Height of one row in px, to turn a drag into a row count. */
  rowHeight: () => number;
  onChange: (count: number) => void;
  testId: string;
}

/**
 * A bar under a list. Drag it down or up to show more or fewer rows; click it to flip between
 * the first few and all of them. The label appears on hover.
 */
export function SidebarGrip({
  shown,
  total,
  collapsedCount,
  rowHeight,
  onChange,
  testId,
}: SidebarGripProps) {
  const { t } = useTranslation("openhands");
  const drag = React.useRef<{
    y: number;
    count: number;
    moved: boolean;
  } | null>(null);
  const hidden = total - shown;
  const label = t(
    hidden > 0
      ? I18nKey.FEED$DETAILS_SHOW_MORE
      : I18nKey.FEED$DETAILS_SHOW_LESS,
  );

  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      aria-expanded={hidden === 0}
      onPointerDown={(event) => {
        drag.current = { y: event.clientY, count: shown, moved: false };
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (!start) return;
        const delta = event.clientY - start.y;
        if (Math.abs(delta) > 4) start.moved = true;
        if (!start.moved) return;
        const next = Math.min(
          total,
          Math.max(1, start.count + Math.round(delta / rowHeight())),
        );
        if (next !== shown) onChange(next);
      }}
      onPointerUp={() => {
        const start = drag.current;
        drag.current = null;
        if (start && !start.moved) {
          onChange(hidden > 0 ? total : collapsedCount);
        }
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      className={cn(
        "group flex w-full shrink-0 cursor-row-resize touch-none flex-col items-center gap-1 rounded-lg px-2 pb-1 pt-1.5 text-xs text-muted",
        "hover:text-contrast focus-visible:text-contrast",
      )}
    >
      <span
        aria-hidden="true"
        className="h-1 w-9 rounded-full bg-border transition-colors group-hover:bg-muted"
      />
      <span className="h-4 leading-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    </button>
  );
}
