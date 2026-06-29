"use client";

import { ChevronLeft, ChevronRight, CircleCheck, KeyRound, ListChecks, PlugZap, ShieldCheck, Activity } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";

import { SIDEBAR_LABELS } from "@/src/constants/sidebar-labels";
import { DashboardNavLink } from "@/src/components/layout/dashboard-nav-link";
import { useDashboardMobileNav } from "@/src/components/layout/dashboard-mobile-nav-context";
import { DashboardUserMenu } from "@/src/components/layout/dashboard-user-menu";
import { OpenHandsLogoLink } from "@/src/components/layout/openhands-logo-link";
import { StatusPill } from "@/src/components/ui/status-pill";
import { getAdminSectionPath, type AdminSection } from "@/src/lib/admin-routes";
import { useEffectiveSidebarCollapsed } from "@/src/hooks/use-effective-sidebar-collapsed";
import { cn } from "@/src/lib/utils";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import {
  SIDEBAR_COLLAPSE_TOGGLE_OVERLAY_CLASS,
  SIDEBAR_COLLAPSED_LOGO_WRAPPER_CLASS,
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
  sidebarStatsRowClassName,
  sidebarStatsRowStyle,
} from "@/src/styles/sidebar-layout";

export type DashboardSidebarItemId =
  | AdminSection
  | "adminOverview"
  | "adminIntegrations";

export interface DashboardSidebarStats {
  liveIntegrations: number;
  pendingUserApprovals: number;
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
    { id: "caseByCaseApprovals" as const, label: "Case-by-case Approvals" },
    { id: "apiKeys" as const, label: "Agent Connection" },
    { id: "permissionProfiles" as const, label: "Permission Profiles" },
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
  statsVisible: boolean;
}

function isNavItemActive(
  activeItem: DashboardSidebarItemId,
  itemId: DashboardSidebarItemId,
): boolean {
  return activeItem === itemId;
}

function DashboardSidebarStatsRow({
  stats,
  visible,
}: {
  stats: DashboardSidebarStats;
  visible: boolean;
}) {
  return (
    <div
      data-testid="dashboard-sidebar-stats"
      className={sidebarStatsRowClassName(visible)}
      style={sidebarStatsRowStyle(visible)}
      aria-hidden={!visible}
    >
      <div className="grid w-full grid-cols-3 gap-2 pr-2.5">
        <StatusPill className="w-full justify-center">
          {stats.liveIntegrations} Live
        </StatusPill>
        <StatusPill className="w-full justify-center">
          {stats.pendingUserApprovals} Pending
        </StatusPill>
        <StatusPill className="w-full justify-center">
          {stats.toolCount} Tools
        </StatusPill>
      </div>
    </div>
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
  statsVisible,
}: DashboardSidebarRailBodyProps) {
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

      <DashboardSidebarStatsRow stats={stats} visible={statsVisible} />

      <nav className={cn(sidebarNavListClassName(collapsed), "mt-3")} aria-label="Main">
        <DashboardNavLink
          href={getAdminSectionPath("integrations")}
          icon={PlugZap}
          label="Integrations"
          active={isNavItemActive(activeItem, "integrations")}
          collapsed={collapsed}
        />
        {showApprovalsLink ? (
          <DashboardNavLink
            href={getAdminSectionPath("caseByCaseApprovals")}
            icon={CircleCheck}
            label="Case-by-case Approvals"
            active={isNavItemActive(activeItem, "caseByCaseApprovals")}
            collapsed={collapsed}
          />
        ) : null}
        <DashboardNavLink
          href={getAdminSectionPath("apiKeys")}
          icon={KeyRound}
          label="Agent Connection"
          active={isNavItemActive(activeItem, "apiKeys")}
          collapsed={collapsed}
        />
        <DashboardNavLink
          href={getAdminSectionPath("permissionProfiles")}
          icon={ListChecks}
          label="Permission Profiles"
          active={isNavItemActive(activeItem, "permissionProfiles")}
          collapsed={collapsed}
        />
      </nav>

      {showAdminOverviewLink || showAdminIntegrationsLink ? (
        <div className={cn(sidebarNavDividerClassName(collapsed), "mt-3 pt-3")}>
          <nav
            className={sidebarNavDividerContentClassName(collapsed)}
            aria-label="Administration"
          >
            {showAdminOverviewLink ? (
              <DashboardNavLink
                href="/admin-overview"
                icon={Activity}
                label="Operational overview"
                active={isNavItemActive(activeItem, "adminOverview")}
                collapsed={collapsed}
              />
            ) : null}
            {showAdminIntegrationsLink ? (
              <DashboardNavLink
                href="/admin-integrations"
                icon={ShieldCheck}
                label="Admin integrations"
                active={isNavItemActive(activeItem, "adminIntegrations")}
                accentWhenActive
                collapsed={collapsed}
              />
            ) : null}
          </nav>
        </div>
      ) : null}

      <div
        className={cn(
          sidebarNavDividerClassName(collapsed),
          "mt-auto pt-3",
          collapsed && "border-t-0",
        )}
      >
        <div className={sidebarNavDividerContentClassName(collapsed)}>
          <DashboardUserMenu
            displayName={userDisplayName}
            email={userEmail}
            collapsed={collapsed}
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
  const setCollapsed = useSidebarStore((state) => state.setCollapsed);
  const { isOpen: isMobileNavOpen, close: closeMobileNav } = useDashboardMobileNav();
  const [mobileDrawerMounted, setMobileDrawerMounted] = React.useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = React.useState(false);
  const [collapsedRailHovered, setCollapsedRailHovered] = React.useState(false);
  const suppressCollapsedExpandRef = React.useRef(false);
  const [, refreshCollapsedExpandGate] = React.useReducer((n) => n + 1, 0);

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
    setCollapsedRailHovered(false);
    suppressCollapsedExpandRef.current = true;
    refreshCollapsedExpandGate();
    setCollapsed(true);
    window.setTimeout(() => {
      suppressCollapsedExpandRef.current = false;
      refreshCollapsedExpandGate();
    }, SIDEBAR_MOBILE_DRAWER_TRANSITION_MS);
  }, [setCollapsed]);

  const showCollapsedExpandButton =
    collapsed && collapsedRailHovered && !suppressCollapsedExpandRef.current;

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
  };

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- collapsed rail hit-area matches agent-canvas sidebar. */}
      <aside
        data-testid="dashboard-sidebar"
        data-collapsed={collapsed ? "true" : "false"}
        aria-label={SIDEBAR_LABELS.navigationAriaLabel}
        onClick={handleCollapsedRailClick}
        onMouseEnter={() => {
          if (collapsed) {
            setCollapsedRailHovered(true);
          }
        }}
        onMouseLeave={() => {
          setCollapsedRailHovered(false);
        }}
        className={cn(
          SIDEBAR_SHELL_BASE_CLASS,
          collapsed ? SIDEBAR_SHELL_COLLAPSED_CLASS : SIDEBAR_SHELL_EXPANDED_CLASS,
        )}
      >
        <DashboardSidebarRailBody
          {...railBodyProps}
          collapsed={collapsed}
          showCollapseToggle
          statsVisible={!collapsed}
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
              statsVisible={mobileDrawerVisible}
            />
          </aside>
        </>
      ) : null}
    </>
  );
}
