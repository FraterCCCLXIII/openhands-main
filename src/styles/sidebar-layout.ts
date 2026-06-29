import { cn } from "@/src/lib/utils";

/** Nav rows — hover color/background snap instantly (matches agent-canvas sidebar). */
export const navInteractiveTransitionClassName =
  "transition-none motion-reduce:transition-none";

export const SIDEBAR_ICON_SLOT_CLASS =
  "flex h-9 w-[18px] shrink-0 items-center justify-center";

export const SIDEBAR_COLLAPSED_ICON_SLOT_CLASS =
  "relative h-9 min-h-9 max-h-9 w-full shrink-0";

export const SIDEBAR_ICON_BUTTON_CLASS = cn(
  "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md",
  navInteractiveTransitionClassName,
  "text-[var(--oh-muted)] hover:bg-[var(--oh-surface-raised)] hover:text-white",
);

export function sidebarHeaderRowClassName(collapsed = false): string {
  return cn(
    "flex h-10 min-h-10 w-full shrink-0 items-center",
    collapsed ? "px-0" : "gap-2 pr-2.5 md:pl-0",
  );
}

export const SIDEBAR_ROW_INTERACTIVE_CLASS = {
  active: "bg-tertiary text-white font-normal",
  idle: "text-[var(--oh-muted)] hover:text-white hover:bg-[var(--oh-surface-raised)]",
} as const;

export function sidebarNavListClassName(collapsed = false): string {
  return cn(
    "flex flex-col gap-0.5 w-full shrink-0 items-stretch",
    !collapsed && "pr-2.5",
  );
}

/** Nav inside full-bleed dividers: restore left inset canceled by divider `-ml-2.5`. */
export function sidebarNavDividerContentClassName(collapsed = false): string {
  return cn(sidebarNavListClassName(collapsed), !collapsed && "pl-2.5");
}

export function sidebarNavRowClassName(options?: {
  collapsed?: boolean;
}): string {
  const { collapsed = false } = options ?? {};
  return cn(
    "flex h-9 min-h-9 min-w-0 items-center rounded-md",
    navInteractiveTransitionClassName,
    "text-sm leading-5 w-full",
    collapsed
      ? "group gap-0 px-0 overflow-visible bg-transparent hover:bg-transparent"
      : "gap-2 px-2.5 overflow-hidden",
  );
}

export function sidebarCollapsedIconBgClassName(active: boolean): string {
  return cn(
    "pointer-events-none absolute inset-0 z-0 rounded-md",
    navInteractiveTransitionClassName,
    active
      ? "bg-tertiary"
      : "bg-transparent group-hover:bg-[var(--oh-surface-raised)]",
  );
}

export function sidebarCollapsedIconGlyphClassName(active: boolean): string {
  return cn(
    "relative z-[1] flex h-full w-full items-center justify-start pl-2.5 [&_svg]:shrink-0",
    active
      ? "text-white font-normal"
      : "text-[var(--oh-muted)] group-hover:text-white",
  );
}

export function sidebarNavLabelClassName(collapsed = false): string {
  if (collapsed) {
    return "sr-only";
  }
  return "min-w-0 truncate";
}

/** Full-bleed divider aligned with the sidebar's vertical border (`--oh-border`). */
export function sidebarNavDividerClassName(collapsed = false): string {
  return cn(
    "shrink-0 border-t border-[var(--oh-border)]",
    collapsed ? "w-full" : "-ml-2.5 w-[calc(100%+0.625rem)]",
  );
}

export const SIDEBAR_COLLAPSED_LOGO_WRAPPER_CLASS = cn(
  "relative hidden md:block shrink-0 overflow-visible",
  SIDEBAR_COLLAPSED_ICON_SLOT_CLASS,
);

export const SIDEBAR_COLLAPSE_TOGGLE_OVERLAY_CLASS = cn(
  "absolute left-1/2 top-1/2 hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 md:inline-flex",
  "items-center justify-center rounded-md",
  navInteractiveTransitionClassName,
  "cursor-pointer",
  "text-[var(--oh-muted)] hover:text-white hover:bg-[var(--oh-surface-raised)]",
);

export const SIDEBAR_SHELL_BASE_CLASS =
  "max-md:hidden flex bg-base flex-col min-h-0 md:border-r md:border-[var(--oh-border)] md:h-full transition-[width,min-width] duration-200";

export const SIDEBAR_SHELL_EXPANDED_CLASS = "md:w-[300px] md:min-w-[300px] pb-2 md:pl-2.5 md:pr-0";

export const SIDEBAR_SHELL_COLLAPSED_CLASS = "md:w-[60px] md:min-w-[60px] md:px-2.5 pb-2";

/** Keep in sync with `duration-200` on `SIDEBAR_SHELL_BASE_CLASS`. */
export const SIDEBAR_SHELL_TRANSITION_MS = 200;

export const SIDEBAR_STATS_TRANSITION_MS = 120;

/** Nav margin slide before stats fade-in on sidebar expand (matches stats slot mt-2 + h-8). */
export const SIDEBAR_NAV_SLIDE_MS = 120;

export const SIDEBAR_NAV_EXPANDED_OFFSET_CLASS = "mt-[3.25rem]";

/** Height of stats slot (mt-2 + h-8) — shifts nav up during collapse fade-out. */
export const SIDEBAR_STATS_BLOCK_SHIFT_CLASS = "-translate-y-[2.5rem]";

/** Fixed-height slot; height snaps only after fade + drawer close (no shrink during fade). */
export function sidebarStatsSlotClassName(layoutVisible: boolean): string {
  return cn(
    "relative w-full shrink-0",
    layoutVisible ? "mt-2 h-8" : "mt-0 h-0",
  );
}

export function sidebarStatsRowClassName(fadeVisible: boolean): string {
  return cn(
    "absolute inset-x-0 top-0 h-8 transition-opacity motion-reduce:transition-none",
    fadeVisible ? "opacity-100" : "pointer-events-none opacity-0",
  );
}

export function sidebarStatsRowStyle(): { transitionDuration: string } {
  return { transitionDuration: `${SIDEBAR_STATS_TRANSITION_MS}ms` };
}

export function sidebarMainNavClassName(options: {
  collapsed: boolean;
  awaitingStats: boolean;
  slideMargin: boolean;
}): string {
  const { collapsed, awaitingStats, slideMargin } = options;
  return cn(
    sidebarNavListClassName(collapsed),
    awaitingStats ? SIDEBAR_NAV_EXPANDED_OFFSET_CLASS : "mt-3",
    slideMargin &&
      "transition-[margin-top] motion-reduce:transition-none duration-[120ms]",
  );
}

export function sidebarBelowStatsBodyClassName(options: {
  shiftUp: boolean;
  animateShift: boolean;
}): string {
  const { shiftUp, animateShift } = options;
  return cn(
    "flex min-h-0 min-w-0 flex-1 flex-col",
    animateShift &&
      "transition-transform motion-reduce:transition-none duration-200",
    shiftUp && SIDEBAR_STATS_BLOCK_SHIFT_CLASS,
  );
}

/** @deprecated Use dynamic shell classes on DashboardSidebar instead. */
export const SIDEBAR_SHELL_CLASS = cn(
  SIDEBAR_SHELL_BASE_CLASS,
  SIDEBAR_SHELL_EXPANDED_CLASS,
);

export const SIDEBAR_MOBILE_DRAWER_CLASS = cn(
  "fixed inset-y-0 left-0 z-50 flex min-h-0 w-[min(300px,85vw)] flex-col bg-base",
  "border-r border-[var(--oh-border)] pb-2 pl-2.5 pr-0 md:hidden",
  "transition-transform ease-in-out motion-reduce:transition-none",
);

export const SIDEBAR_MOBILE_DRAWER_TRANSITION_MS = 250;

export const SIDEBAR_MAIN_SCROLL_CLASS =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto custom-scrollbar-always px-4 pt-4 pb-12 md:px-[14px] md:pt-8";
