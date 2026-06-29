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

export const SIDEBAR_STATS_TRANSITION_MS = 120;

export function sidebarStatsRowClassName(visible: boolean): string {
  return cn(
    "overflow-hidden transition-[opacity,max-height,margin-top] motion-reduce:transition-none",
    visible
      ? "max-h-24 opacity-100 mt-2"
      : "max-h-0 opacity-0 mt-0 pointer-events-none",
  );
}

/** Opacity fades; max-height/margin snap on open and only after fade-out on close (no resize during fade). */
export function sidebarStatsRowStyle(visible: boolean): {
  transitionDuration: string;
  transitionDelay: string;
} {
  const ms = SIDEBAR_STATS_TRANSITION_MS;
  if (visible) {
    return {
      transitionDuration: `${ms}ms, 0ms, 0ms`,
      transitionDelay: "0ms, 0ms, 0ms",
    };
  }

  return {
    transitionDuration: `${ms}ms, 0ms, 0ms`,
    transitionDelay: `0ms, ${ms}ms, ${ms}ms`,
  };
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
