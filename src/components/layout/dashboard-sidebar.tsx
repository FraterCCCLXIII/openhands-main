"use client";

import { Blocks, ChevronLeft, ChevronRight, CircleCheck, Grid2x2, KeyRound, Target } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";

import { HUB_PAGE_COPY } from "@/src/constants/hub-pages";
import { SIDEBAR_LABELS } from "@/src/constants/sidebar-labels";
import { DashboardNavLink } from "@/src/components/layout/dashboard-nav-link";
import { useDashboardMobileNav } from "@/src/components/layout/dashboard-mobile-nav-context";
import { DashboardUserMenu } from "@/src/components/layout/dashboard-user-menu";
import { OpenHandsLogoLink } from "@/src/components/layout/openhands-logo-link";
import { StatusPill } from "@/src/components/ui/status-pill";
import { getAdminSectionPath, type AdminSection } from "@/src/lib/admin-routes";
import { useEffectiveSidebarCollapsed } from "@/src/hooks/use-effective-sidebar-collapsed";
import { usePendingApprovalsCount } from "@/src/hooks/use-pending-approvals-count";
import { cn } from "@/src/lib/utils";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import {
  SIDEBAR_COLLAPSE_TOGGLE_OVERLAY_CLASS,
  SIDEBAR_COLLAPSED_LOGO_WRAPPER_CLASS,
  SIDEBAR_COLLAPSED_EXPAND_GAP_CLASS,
  SIDEBAR_ICON_BUTTON_CLASS,
  SIDEBAR_ICON_SLOT_CLASS,
  SIDEBAR_MOBILE_DRAWER_CLASS,
  SIDEBAR_MOBILE_DRAWER_TRANSITION_MS,
  SIDEBAR_SHELL_BASE_CLASS,
  SIDEBAR_SHELL_COLLAPSED_CLASS,
  SIDEBAR_SHELL_EXPANDED_CLASS,
  sidebarHeaderRowClassName,
  sidebarNavDividerClassName,
  sidebarNavDividerContentClassName,
  sidebarNavListClassName,
  SIDEBAR_SHELL_TRANSITION_MS,
  SIDEBAR_STATS_TRANSITION_MS,
  sidebarStatsRowClassName,
  sidebarStatsRowStyle,
  sidebarStatsSlotClassName,
  sidebarMainNavClassName,
  sidebarBelowStatsBodyClassName,
  SIDEBAR_NAV_SLIDE_MS,
} from "@/src/styles/sidebar-layout";

export type DashboardSidebarItemId =
  | AdminSection
  | "adminOverview"
  | "adminIntegrations";

export interface DashboardSidebarStats {
  liveIntegrations: number;
  toolCount: number;
}

const HUB_SIDEBAR_TITLE = "Integrations Hub";

export const getDashboardSections = (
  showApprovalsLink = true,
): Array<{
  id: AdminSection;
  label: string;
}> =>
  [
    { id: "integrations" as const, label: "Integrations" },
    { id: "caseByCaseApprovals" as const, label: "Agent requests" },
    { id: "apiKeys" as const, label: HUB_PAGE_COPY.agentConnection.title },
  ].filter((item) => showApprovalsLink || item.id !== "caseByCaseApprovals");

interface DashboardSidebarRailBodyProps {
  activeItem: DashboardSidebarItemId;
  stats: DashboardSidebarStats;
  userDisplayName: string;
  userEmail: string;
  showAdminOverviewLink?: boolean;
  showAdminIntegrationsLink?: boolean;
  showApprovalsLink?: boolean;
  collapsed: boolean;
  showCollapseToggle: boolean;
  showMobileCloseButton?: boolean;
  onCloseMobile?: () => void;
  collapseToggleLabel: string;
  onCollapse: () => void;
  onExpand: () => void;
  showCollapsedExpandButton: boolean;
  onCollapsedExpandZoneEnter: () => void;
  onCollapsedExpandZoneLeave: () => void;
  statsLayoutVisible: boolean;
  statsFadeVisible: boolean;
  navAwaitingStats: boolean;
  navSlideMargin: boolean;
  navCollapseShift: boolean;
  userMenuCollapsed: boolean;
}

function isNavItemActive(
  activeItem: DashboardSidebarItemId,
  itemId: DashboardSidebarItemId,
): boolean {
  return activeItem === itemId;
}

function useSidebarExpandSequence(
  expanded: boolean,
  deferRevealUntilShellOpens: boolean,
  userInitiatedCollapse: boolean,
): {
  layoutVisible: boolean;
  fadeVisible: boolean;
  navAwaitingStats: boolean;
  navSlideMargin: boolean;
  navCollapseShift: boolean;
  shellExpanded: boolean;
} {
  const [layoutVisible, setLayoutVisible] = React.useState(expanded);
  const [fadeVisible, setFadeVisible] = React.useState(expanded);
  const [navAwaitingStats, setNavAwaitingStats] = React.useState(false);
  const [navSlideMargin, setNavSlideMargin] = React.useState(false);
  const [navCollapseShift, setNavCollapseShift] = React.useState(false);
  const [shellExpanded, setShellExpanded] = React.useState(expanded);
  const prevExpandedRef = React.useRef(expanded);

  React.useEffect(() => {
    const wasExpanded = prevExpandedRef.current;
    prevExpandedRef.current = expanded;

    if (!expanded) {
      setNavAwaitingStats(false);

      if (!wasExpanded || !userInitiatedCollapse) {
        setFadeVisible(false);
        setLayoutVisible(false);
        setNavSlideMargin(false);
        setNavCollapseShift(false);
        setShellExpanded(false);
        return;
      }

      setShellExpanded(true);
      setFadeVisible(false);

      let shiftFrame = 0;
      let shiftFrameOuter = 0;
      const shiftTimer = window.setTimeout(() => {
        setNavSlideMargin(true);
        shiftFrameOuter = requestAnimationFrame(() => {
          shiftFrame = requestAnimationFrame(() => {
            setNavCollapseShift(true);
          });
        });
      }, SIDEBAR_STATS_TRANSITION_MS);

      const widthTimer = window.setTimeout(() => {
        setShellExpanded(false);
      }, SIDEBAR_STATS_TRANSITION_MS);

      const collapseTimer = window.setTimeout(() => {
        setLayoutVisible(false);
        setNavCollapseShift(false);
        setNavSlideMargin(false);
      }, SIDEBAR_STATS_TRANSITION_MS + SIDEBAR_SHELL_TRANSITION_MS);

      return () => {
        window.clearTimeout(shiftTimer);
        window.clearTimeout(widthTimer);
        window.clearTimeout(collapseTimer);
        cancelAnimationFrame(shiftFrameOuter);
        cancelAnimationFrame(shiftFrame);
      };
    }

    if (wasExpanded) {
      setLayoutVisible(true);
      setFadeVisible(true);
      setNavAwaitingStats(false);
      setNavSlideMargin(false);
      setNavCollapseShift(false);
      setShellExpanded(true);
      return;
    }

    if (deferRevealUntilShellOpens) {
      setLayoutVisible(false);
      setFadeVisible(false);
      setNavAwaitingStats(false);
      setNavSlideMargin(false);
      setNavCollapseShift(false);
      setShellExpanded(true);

      let statsTimer = 0;
      const shellTimer = window.setTimeout(() => {
        setNavSlideMargin(true);
        setNavAwaitingStats(true);
        statsTimer = window.setTimeout(() => {
          setLayoutVisible(true);
          setFadeVisible(true);
          setNavAwaitingStats(false);
          setNavSlideMargin(false);
        }, SIDEBAR_NAV_SLIDE_MS);
      }, SIDEBAR_SHELL_TRANSITION_MS);

      return () => {
        window.clearTimeout(shellTimer);
        window.clearTimeout(statsTimer);
      };
    }

    setLayoutVisible(true);
    setFadeVisible(true);
    setNavAwaitingStats(false);
    setNavSlideMargin(false);
    setNavCollapseShift(false);
    setShellExpanded(true);
  }, [deferRevealUntilShellOpens, expanded, userInitiatedCollapse]);

  return {
    layoutVisible,
    fadeVisible,
    navAwaitingStats,
    navSlideMargin,
    navCollapseShift,
    shellExpanded,
  };
}

function DashboardSidebarStatsRow({
  stats,
  layoutVisible,
  fadeVisible,
}: {
  stats: DashboardSidebarStats;
  layoutVisible: boolean;
  fadeVisible: boolean;
}) {
  return (
    <div className={sidebarStatsSlotClassName(layoutVisible)}>
      <div
        data-testid="dashboard-sidebar-stats"
        className={sidebarStatsRowClassName(fadeVisible)}
        style={sidebarStatsRowStyle()}
        aria-hidden={!fadeVisible}
      >
        <div className="grid w-full grid-cols-2 gap-2 pr-2.5">
          <StatusPill className="w-full justify-center">
            {stats.liveIntegrations} Live
          </StatusPill>
          <StatusPill className="w-full justify-center">
            {stats.toolCount} Tools
          </StatusPill>
        </div>
      </div>
    </div>
  );
}

function CollapsedSidebarExpandGap({
  className,
  onEnter,
  onLeave,
}: {
  className?: string;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      aria-hidden
      data-testid="dashboard-sidebar-expand-gap"
      className={cn(SIDEBAR_COLLAPSED_EXPAND_GAP_CLASS, className)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    />
  );
}

function DashboardSidebarRailBody({
  activeItem,
  stats,
  userDisplayName,
  userEmail,
  showAdminOverviewLink = false,
  showAdminIntegrationsLink = false,
  showApprovalsLink = true,
  collapsed,
  showCollapseToggle,
  showMobileCloseButton = false,
  onCloseMobile,
  collapseToggleLabel,
  onCollapse,
  onExpand,
  showCollapsedExpandButton,
  onCollapsedExpandZoneEnter,
  onCollapsedExpandZoneLeave,
  statsLayoutVisible,
  statsFadeVisible,
  navAwaitingStats,
  navSlideMargin,
  navCollapseShift,
  userMenuCollapsed,
}: DashboardSidebarRailBodyProps) {
  const showCollapsedExpandZones = collapsed && showCollapseToggle;
  const pendingApprovalsCount = usePendingApprovalsCount({
    enabled: showApprovalsLink,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={sidebarHeaderRowClassName(collapsed)}>
        {collapsed ? (
          <div
            className={cn(
              showCollapseToggle
                ? SIDEBAR_COLLAPSED_LOGO_WRAPPER_CLASS
                : "flex min-w-0 shrink-0 items-center",
            )}
            onMouseEnter={
              showCollapsedExpandZones ? onCollapsedExpandZoneEnter : undefined
            }
            onMouseLeave={
              showCollapsedExpandZones ? onCollapsedExpandZoneLeave : undefined
            }
          >
            <div
              className={cn(
                showCollapseToggle &&
                  "flex h-full w-full items-center justify-start pl-2.5 transition-opacity duration-150",
                showCollapsedExpandButton && "opacity-0",
              )}
            >
              <OpenHandsLogoLink
                className={cn(SIDEBAR_ICON_SLOT_CLASS, "overflow-visible")}
              />
            </div>
            {showCollapseToggle ? (
              <button
                type="button"
                data-testid="dashboard-sidebar-collapse-toggle"
                aria-pressed={collapsed}
                aria-label={collapseToggleLabel}
                onClick={onExpand}
                className={cn(
                  SIDEBAR_COLLAPSE_TOGGLE_OVERLAY_CLASS,
                  showCollapsedExpandButton
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0",
                )}
              >
                <ChevronRight width={14} height={14} aria-hidden />
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <OpenHandsLogoLink className="overflow-visible" />
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
              {HUB_SIDEBAR_TITLE}
            </p>
            {showCollapseToggle ? (
              <button
                type="button"
                data-testid="dashboard-sidebar-collapse-toggle"
                aria-pressed={collapsed}
                aria-label={collapseToggleLabel}
                onClick={onCollapse}
                className={cn(
                  "hidden shrink-0 md:inline-flex",
                  SIDEBAR_ICON_BUTTON_CLASS,
                )}
              >
                <ChevronLeft width={14} height={14} aria-hidden />
              </button>
            ) : null}
            {showMobileCloseButton ? (
              <button
                type="button"
                data-testid="dashboard-mobile-drawer-close"
                onClick={onCloseMobile}
                aria-label={SIDEBAR_LABELS.closeMenu}
                className={cn("ml-auto inline-flex", SIDEBAR_ICON_BUTTON_CLASS)}
              >
                <ChevronLeft width={14} height={14} aria-hidden strokeWidth={2} />
              </button>
            ) : null}
          </>
        )}
      </div>

      <DashboardSidebarStatsRow
        stats={stats}
        layoutVisible={statsLayoutVisible}
        fadeVisible={statsFadeVisible}
      />

      <div
        className={sidebarBelowStatsBodyClassName({
          shiftUp: navCollapseShift,
          animateShift: navSlideMargin,
        })}
      >
        {showCollapsedExpandZones ? (
          <CollapsedSidebarExpandGap
            className="h-3"
            onEnter={onCollapsedExpandZoneEnter}
            onLeave={onCollapsedExpandZoneLeave}
          />
        ) : null}
        <nav
          className={sidebarMainNavClassName({
            collapsed,
            awaitingStats: navAwaitingStats,
            slideMargin: navSlideMargin,
          })}
          aria-label="Main"
        >
        <DashboardNavLink
          href={getAdminSectionPath("integrations")}
          icon={Blocks}
          label="Integrations"
          active={isNavItemActive(activeItem, "integrations")}
          collapsed={collapsed}
        />
        {showApprovalsLink ? (
          <DashboardNavLink
            href={getAdminSectionPath("caseByCaseApprovals")}
            icon={CircleCheck}
            label="Agent requests"
            active={isNavItemActive(activeItem, "caseByCaseApprovals")}
            collapsed={collapsed}
            trailingCount={pendingApprovalsCount}
          />
        ) : null}
        <DashboardNavLink
          href={getAdminSectionPath("apiKeys")}
          icon={KeyRound}
          label={HUB_PAGE_COPY.agentConnection.title}
          active={isNavItemActive(activeItem, "apiKeys")}
          collapsed={collapsed}
        />
      </nav>

      {showAdminOverviewLink || showAdminIntegrationsLink ? (
        <>
          {showCollapsedExpandZones ? (
            <CollapsedSidebarExpandGap
              className="h-3"
              onEnter={onCollapsedExpandZoneEnter}
              onLeave={onCollapsedExpandZoneLeave}
            />
          ) : null}
          <div
            className={cn(
              sidebarNavDividerClassName(collapsed),
              collapsed ? "pt-3" : "mt-3 pt-3",
            )}
          >
          <nav
            className={sidebarNavDividerContentClassName(collapsed)}
            aria-label="Administration"
          >
            {showAdminOverviewLink ? (
              <DashboardNavLink
                href="/admin-overview"
                icon={Target}
                label="Operational Overview"
                active={isNavItemActive(activeItem, "adminOverview")}
                collapsed={collapsed}
              />
            ) : null}
            {showAdminIntegrationsLink ? (
              <DashboardNavLink
                href="/admin-integrations"
                icon={Grid2x2}
                label="Admin Integrations"
                active={isNavItemActive(activeItem, "adminIntegrations")}
                accentWhenActive
                collapsed={collapsed}
              />
            ) : null}
          </nav>
          </div>
        </>
      ) : null}
      </div>

      {showCollapsedExpandZones ? (
        <CollapsedSidebarExpandGap
          className="min-h-3 flex-1"
          onEnter={onCollapsedExpandZoneEnter}
          onLeave={onCollapsedExpandZoneLeave}
        />
      ) : null}

      <div
        className={cn(
          sidebarNavDividerClassName(collapsed),
          !showCollapsedExpandZones && "mt-auto",
          "shrink-0 pt-3",
          collapsed && "border-t-0",
        )}
      >
        <div className={sidebarNavDividerContentClassName(collapsed)}>
          <DashboardUserMenu
            displayName={userDisplayName}
            email={userEmail}
            collapsed={userMenuCollapsed}
          />
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar({
  activeItem,
  stats,
  userDisplayName,
  userEmail,
  showAdminOverviewLink = false,
  showAdminIntegrationsLink = false,
  showApprovalsLink = true,
}: {
  activeItem: DashboardSidebarItemId;
  stats: DashboardSidebarStats;
  userDisplayName: string;
  userEmail: string;
  showAdminOverviewLink?: boolean;
  showAdminIntegrationsLink?: boolean;
  showApprovalsLink?: boolean;
}) {
  const pathname = usePathname();
  const collapsed = useEffectiveSidebarCollapsed();
  const userCollapsed = useSidebarStore((state) => state.collapsed);
  const setCollapsed = useSidebarStore((state) => state.setCollapsed);
  const { isOpen: isMobileNavOpen, close: closeMobileNav } = useDashboardMobileNav();
  const [mobileDrawerMounted, setMobileDrawerMounted] = React.useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = React.useState(false);
  const [collapsedExpandHoverDepth, setCollapsedExpandHoverDepth] =
    React.useState(0);
  const suppressCollapsedExpandRef = React.useRef(false);
  const [, refreshCollapsedExpandGate] = React.useReducer((n) => n + 1, 0);

  const handleCollapsedExpandZoneEnter = React.useCallback(() => {
    setCollapsedExpandHoverDepth((depth) => depth + 1);
  }, []);

  const handleCollapsedExpandZoneLeave = React.useCallback(() => {
    setCollapsedExpandHoverDepth((depth) => Math.max(0, depth - 1));
  }, []);

  React.useEffect(() => {
    if (!collapsed) {
      setCollapsedExpandHoverDepth(0);
    }
  }, [collapsed]);

  React.useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  React.useEffect(() => {
    if (isMobileNavOpen) {
      setMobileDrawerMounted(true);
      setMobileDrawerVisible(false);

      let openFrame2 = 0;
      const openFrame1 = requestAnimationFrame(() => {
        openFrame2 = requestAnimationFrame(() => {
          setMobileDrawerVisible(true);
        });
      });

      return () => {
        cancelAnimationFrame(openFrame1);
        cancelAnimationFrame(openFrame2);
      };
    }

    setMobileDrawerVisible(false);
    const timer = window.setTimeout(() => {
      setMobileDrawerMounted(false);
    }, SIDEBAR_MOBILE_DRAWER_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [isMobileNavOpen]);

  React.useEffect(() => {
    if (!isMobileNavOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileNav();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileNavOpen, closeMobileNav]);

  const collapseToggleLabel = collapsed
    ? SIDEBAR_LABELS.expand
    : SIDEBAR_LABELS.collapse;

  const handleCollapsedRailClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!collapsed) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (
        target.closest(
          "a,button,input,textarea,select,[role='button'],[role='link']",
        )
      ) {
        return;
      }

      setCollapsed(false);
    },
    [collapsed, setCollapsed],
  );

  const handleCollapse = React.useCallback(() => {
    setCollapsedExpandHoverDepth(0);
    suppressCollapsedExpandRef.current = true;
    refreshCollapsedExpandGate();
    setCollapsed(true);
    window.setTimeout(() => {
      suppressCollapsedExpandRef.current = false;
      refreshCollapsedExpandGate();
    }, SIDEBAR_MOBILE_DRAWER_TRANSITION_MS);
  }, [setCollapsed]);

  const showCollapsedExpandButton =
    collapsed &&
    collapsedExpandHoverDepth > 0 &&
    !suppressCollapsedExpandRef.current;

  const collapsedExpandZoneProps = {
    onCollapsedExpandZoneEnter: handleCollapsedExpandZoneEnter,
    onCollapsedExpandZoneLeave: handleCollapsedExpandZoneLeave,
  };

  const desktopExpandSequence = useSidebarExpandSequence(
    !collapsed,
    true,
    userCollapsed,
  );
  const mobileExpandSequence = useSidebarExpandSequence(
    mobileDrawerVisible,
    false,
    false,
  );

  const railBodyProps = {
    activeItem,
    stats,
    userDisplayName,
    userEmail,
    showAdminOverviewLink,
    showAdminIntegrationsLink,
    showApprovalsLink,
    collapseToggleLabel,
    onCollapse: handleCollapse,
    onExpand: () => setCollapsed(false),
    showCollapsedExpandButton,
    ...collapsedExpandZoneProps,
  };

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- collapsed rail hit-area matches agent-canvas sidebar. */}
      <aside
        data-testid="dashboard-sidebar"
        data-collapsed={collapsed ? "true" : "false"}
        aria-label={SIDEBAR_LABELS.navigationAriaLabel}
        onClick={handleCollapsedRailClick}
        className={cn(
          SIDEBAR_SHELL_BASE_CLASS,
          desktopExpandSequence.shellExpanded
            ? SIDEBAR_SHELL_EXPANDED_CLASS
            : SIDEBAR_SHELL_COLLAPSED_CLASS,
        )}
      >
        <DashboardSidebarRailBody
          {...railBodyProps}
          collapsed={collapsed}
          showCollapseToggle
          statsLayoutVisible={desktopExpandSequence.layoutVisible}
          statsFadeVisible={desktopExpandSequence.fadeVisible}
          navAwaitingStats={desktopExpandSequence.navAwaitingStats}
          navSlideMargin={desktopExpandSequence.navSlideMargin}
          navCollapseShift={desktopExpandSequence.navCollapseShift}
          userMenuCollapsed={
            collapsed && !desktopExpandSequence.shellExpanded
          }
        />
      </aside>

      {mobileDrawerMounted ? (
        <>
          <div
            className={cn(
              "fixed inset-0 z-40 bg-black/50 md:hidden",
              "transition-opacity ease-in-out motion-reduce:transition-none",
              mobileDrawerVisible
                ? "opacity-100"
                : "pointer-events-none opacity-0",
            )}
            style={{
              transitionDuration: `${SIDEBAR_MOBILE_DRAWER_TRANSITION_MS}ms`,
            }}
            onClick={closeMobileNav}
            aria-hidden={!mobileDrawerVisible}
          />
          <aside
            data-testid="dashboard-sidebar-mobile-drawer"
            aria-label={SIDEBAR_LABELS.navigationAriaLabel}
            aria-hidden={!mobileDrawerVisible}
            className={cn(
              SIDEBAR_MOBILE_DRAWER_CLASS,
              mobileDrawerVisible ? "translate-x-0" : "-translate-x-full",
            )}
            style={{
              transitionDuration: `${SIDEBAR_MOBILE_DRAWER_TRANSITION_MS}ms`,
            }}
          >
            <DashboardSidebarRailBody
              {...railBodyProps}
              collapsed={false}
              showCollapseToggle={false}
              showMobileCloseButton
              onCloseMobile={closeMobileNav}
              statsLayoutVisible={mobileExpandSequence.layoutVisible}
              statsFadeVisible={mobileExpandSequence.fadeVisible}
              navAwaitingStats={mobileExpandSequence.navAwaitingStats}
              navSlideMargin={mobileExpandSequence.navSlideMargin}
              navCollapseShift={mobileExpandSequence.navCollapseShift}
              userMenuCollapsed={false}
            />
          </aside>
        </>
      ) : null}
    </>
  );
}
