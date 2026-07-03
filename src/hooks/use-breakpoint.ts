"use client";

import { useEffect, useRef, useState } from "react";

export const MOBILE_BREAKPOINT = 1024;

/**
 * Inclusive max width where the primary sidebar rail is hidden (`max-md:hidden`)
 * and the slide-out drawer is used. Matches typical Tailwind `md` (48rem): rail
 * shows from 768px upward, so we treat width <= 767 as drawer-only.
 */
export const SIDEBAR_RAIL_COLLAPSE_MAX_WIDTH = 767;

/**
 * Returns true when window width is at or below the breakpoint.
 * Only triggers a re-render when the boolean value changes (i.e., when the
 * width crosses the breakpoint), NOT on every pixel of resize.
 */
export function useBreakpoint(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [isAtOrBelow, setIsAtOrBelow] = useState(false);
  const isAtOrBelowRef = useRef(isAtOrBelow);

  useEffect(() => {
    function handleResize() {
      const next = window.innerWidth <= breakpoint;
      if (next !== isAtOrBelowRef.current) {
        isAtOrBelowRef.current = next;
        setIsAtOrBelow(next);
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isAtOrBelow;
}
