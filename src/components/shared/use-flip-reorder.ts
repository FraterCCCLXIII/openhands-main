import React from "react";

const FLIP_ATTRIBUTE = "data-flip-id";
const FLIP_DURATION_MS = 220;

/**
 * Slides rows to their new position when `order` changes. Mark each row with
 * `data-flip-id`; the hook measures them before paint and animates the offset
 * back to zero, so a reorder reads as movement instead of a jump.
 */
export function useFlipReorder<T extends HTMLElement>(
  order: readonly string[],
  active = true,
) {
  const containerRef = React.useRef<T>(null);
  const previousTops = React.useRef(new Map<string, number>());

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!active || !container) {
      previousTops.current.clear();
      return;
    }

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const base = container.getBoundingClientRect().top;
    const rows = container.querySelectorAll<HTMLElement>(`[${FLIP_ATTRIBUTE}]`);

    rows.forEach((row) => {
      const id = row.getAttribute(FLIP_ATTRIBUTE);
      if (!id) return;
      const top = row.getBoundingClientRect().top - base;
      const before = previousTops.current.get(id);
      previousTops.current.set(id, top);
      if (
        reduceMotion ||
        typeof row.animate !== "function" ||
        before === undefined ||
        before === top
      ) {
        return;
      }

      row.animate(
        [
          { transform: `translateY(${before - top}px)` },
          { transform: "translateY(0)" },
        ],
        { duration: FLIP_DURATION_MS, easing: "ease" },
      );
    });
  }, [order, active]);

  return containerRef;
}
