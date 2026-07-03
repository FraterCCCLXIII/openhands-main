"use client";

import {
  MOBILE_BREAKPOINT,
  SIDEBAR_RAIL_COLLAPSE_MAX_WIDTH,
  useBreakpoint,
} from "@/src/hooks/use-breakpoint";
import { useSidebarStore } from "@/src/stores/sidebar-store";

/**
 * Collapsed rail (60px) when the user toggled collapse or when the viewport is
 * in the compact desktop band (768px–1024px), matching agent-canvas density on
 * tablet-sized windows without persisting viewport-driven collapse to storage.
 */
export function useEffectiveSidebarCollapsed(): boolean {
  const userCollapsed = useSidebarStore((state) => state.collapsed);
  const isSidebarRailHidden = useBreakpoint(SIDEBAR_RAIL_COLLAPSE_MAX_WIDTH);
  const isCompactDesktop =
    useBreakpoint(MOBILE_BREAKPOINT) && !isSidebarRailHidden;

  return userCollapsed || isCompactDesktop;
}
