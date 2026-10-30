import React from "react";
import { useTranslation } from "react-i18next";
import {
  Blocks,
  Bot,
  ChevronLeft,
  Factory,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Server,
  Settings,
} from "lucide-react";
import { SidebarAppsList } from "./sidebar-apps-list";
import { OpenHandsLogoButton } from "#/components/shared/buttons/openhands-logo-button";
import { NavigationLink } from "#/components/shared/navigation-link";
import { getLockedCloudHost } from "#/api/agent-server-config";
import { DEFAULT_SETTINGS } from "#/services/settings";
import {
  automationListPath,
  getInterfaceCopy,
  hasAutomationInterface,
} from "#/manifests/automation-interface";
import { CUSTOMIZE_PATH } from "#/hooks/use-pinned-home-route";
import { SidebarCollapsedIconSlot } from "./sidebar-collapsed-icon-slot";
import { CommandMenuTrigger } from "#/components/features/command-menu/command-menu-trigger";
import { SidebarNavLink } from "./sidebar-nav-link";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import {
  chatInputAddButtonSurfaceClassName,
  chatInputIconButtonClassName,
} from "#/utils/form-control-classes";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";
import { BackendSelector } from "#/components/features/backends/backend-selector";
import { BackendStatusDot } from "#/components/features/backends/backend-status-dot";
import { SidebarConversationList } from "./sidebar-conversation-list";
import { SidebarOnboardingChecklist } from "./sidebar-onboarding-checklist";
import { SidebarCreateMenu } from "./sidebar-create-menu";
import { SidebarSettingsPopover } from "./sidebar-settings-popover";
import { SidebarFloatingUpdate } from "./sidebar-floating-update";
import { applyThemeForBackend } from "#/stores/backend-color-theme-store";
import { useSettings } from "#/hooks/query/use-settings";
import CustomizeBoxesIcon from "#/icons/customize-boxes.svg?react";
import AutomationsIcon from "#/icons/automations.svg?react";
import {
  SIDEBAR_COLLAPSE_TOGGLE_OVERLAY_CLASS,
  SIDEBAR_COLLAPSED_LOGO_WRAPPER_CLASS,
  SIDEBAR_ICON_BUTTON_CLASS,
  SIDEBAR_ICON_SLOT_CLASS,
  sidebarHeaderRowClassName,
  sidebarNavLabelClassName,
  sidebarNavListClassName,
  sidebarNavRowClassName,
} from "./sidebar-layout";
import type { Backend } from "#/api/backend-registry/types";
import { isDesktopShell, isMacDesktopShell } from "#/utils/desktop-shell";
import { useDesktopFullScreen } from "#/hooks/use-desktop-full-screen";

const APPS_PATH = "/apps";
const FACTORY_PATH = "/factory";
const AGENTS_PATH = "/agents";
const TEAM_PATH = "/team";
const ICON_SIZE = 18;
const REPORT_BUG_URL = "https://github.com/OpenHands/OpenHands/issues/new";
const PLANNING_PATH = "/planning";
const SIDEBAR_LOGO_WIDTH = 34;
const SIDEBAR_LOGO_HEIGHT = Math.round((SIDEBAR_LOGO_WIDTH * 30) / 46);

export interface SidebarRailBodyProps {
  collapsed: boolean;
  showCollapseToggle: boolean;
  showMobileCloseButton?: boolean;
  onCloseMobile?: () => void;
  collapseToggleLabel: string;
  onCollapse: () => void;
  onExpand: () => void;
  showCollapsedExpandButton: boolean;
  isExtensionsActive: boolean;
  currentPath: string;
  activeBackend: Backend;
  activeOrgId: string | null;
  activeBackendHealth: { isConnected: boolean | null } | undefined;
  collapsedBackendPopoverOpen: boolean;
  setCollapsedBackendPopoverOpen: (open: boolean) => void;
  collapsedBackendPopoverRef: React.RefObject<HTMLDivElement | null>;
  collapsedBackendCloseTimer: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  onOpenAddBackend: () => void;
  onOpenManageBackends: () => void;
}

export function SidebarRailBody({
  collapsed,
  showCollapseToggle,
  showMobileCloseButton = false,
  onCloseMobile,
  collapseToggleLabel,
  onCollapse,
  onExpand,
  showCollapsedExpandButton,
  isExtensionsActive,
  currentPath,
  activeBackend,
  activeOrgId,
  activeBackendHealth,
  collapsedBackendPopoverOpen,
  setCollapsedBackendPopoverOpen,
  collapsedBackendPopoverRef,
  collapsedBackendCloseTimer,
  onOpenAddBackend,
  onOpenManageBackends,
}: SidebarRailBodyProps) {
  const { t } = useTranslation("openhands");
  const { data: settings } = useSettings();
  // The settings hook fills in placeholder git identity values when the user
  // has not set one, so hide those rather than showing them as the account.
  const gitUserName = settings?.git_user_name?.trim();
  const userName =
    gitUserName && gitUserName !== DEFAULT_SETTINGS.git_user_name
      ? gitUserName
      : undefined;
  const gitUserEmail = settings?.git_user_email?.trim();
  const userEmail =
    settings?.email?.trim() ||
    (gitUserEmail && gitUserEmail !== DEFAULT_SETTINGS.git_user_email
      ? gitUserEmail
      : undefined);
  const backendCloseTimerRef = collapsedBackendCloseTimer;

  // Each backend keeps its own color theme; switching backends applies it.
  React.useEffect(() => {
    applyThemeForBackend(activeBackend.id);
  }, [activeBackend.id]);

  const isCloudBackend = activeBackend.kind === "cloud";
  // `org` is consumed by the cloud settings loader so the page opens on the
  // org that is active here instead of the cloud's last-used org.
  const cloudSettingsOrgQuery = activeOrgId
    ? `?org=${encodeURIComponent(activeOrgId)}`
    : "";
  const cloudSettingsUrl = isCloudBackend
    ? `${activeBackend.host.replace(/\/+$/, "")}/settings${cloudSettingsOrgQuery}`
    : null;
  // Locked-to-Cloud (SaaS / self-hosted OHE) serves the canvas at /canvas on
  // the cloud host itself, so cloud settings open in this tab and Back
  // returns here (OHE-3242). Standalone / Electron keep the new tab.
  const isLockedToCloud = getLockedCloudHost() !== null;
  const isFullScreen = useDesktopFullScreen();
  const showTitleBand = isMacDesktopShell() && !isFullScreen;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          sidebarHeaderRowClassName(collapsed),
          // Desktop title-band: the header shares the traffic-light row, with
          // the collapse control at the right and the lights kept clear.
          showTitleBand && !collapsed && "-mt-7 mb-7 justify-end pl-20",
        )}
      >
        <div
          className={cn(
            collapsed && showCollapseToggle
              ? SIDEBAR_COLLAPSED_LOGO_WRAPPER_CLASS
              : "flex min-w-0 flex-1 items-center",
          )}
        >
          <div
            className={cn(
              collapsed &&
                showCollapseToggle &&
                "flex h-full w-full items-center justify-start pl-2.5 transition-opacity duration-150",
              collapsed && showCollapsedExpandButton && "opacity-0",
              !collapsed && "min-w-0 flex-1",
            )}
          >
            {!collapsed ? (
              <div className="w-full pb-2">
                <BackendSelector identityHeader sidebarCollapsed={false} />
              </div>
            ) : isDesktopShell() ? null : (
              <OpenHandsLogoButton
                logoWidth={SIDEBAR_LOGO_WIDTH}
                logoHeight={SIDEBAR_LOGO_HEIGHT}
                logoClassName="max-w-none"
                className={cn(SIDEBAR_ICON_SLOT_CLASS, "overflow-visible")}
              />
            )}
          </div>
          {collapsed && showCollapseToggle ? (
            <button
              type="button"
              data-testid="sidebar-collapse-toggle"
              aria-pressed={collapsed}
              aria-label={collapseToggleLabel}
              onClick={onExpand}
              className={cn(
                SIDEBAR_COLLAPSE_TOGGLE_OVERLAY_CLASS,
                showCollapsedExpandButton
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none",
              )}
            >
              <PanelLeftOpen width={16} height={16} aria-hidden />
            </button>
          ) : null}
        </div>
        {!collapsed && showMobileCloseButton ? (
          <button
            type="button"
            data-testid="sidebar-mobile-drawer-close"
            onClick={onCloseMobile}
            aria-label={t(I18nKey.SIDEBAR$CLOSE_MENU)}
            className={cn(
              "inline-flex ml-auto",
              SIDEBAR_ICON_BUTTON_CLASS,
              "text-muted hover:text-contrast hover:bg-surface-raised",
            )}
          >
            <ChevronLeft width={14} height={14} />
          </button>
        ) : null}
      </div>

      <nav className={sidebarNavListClassName(collapsed)}>
        {collapsed ? <CommandMenuTrigger collapsed /> : null}
        <SidebarNavLink
          to="/conversations"
          end
          label={t(I18nKey.SIDEBAR$NEW_CHAT)}
          testId="sidebar-conversations-link"
          collapsed={collapsed}
          icon={
            <span
              className={cn(
                chatInputIconButtonClassName,
                chatInputAddButtonSurfaceClassName,
                "size-4.5",
              )}
              aria-hidden="true"
            >
              <Plus className="h-2.5 w-2.5 shrink-0" strokeWidth={3} />
            </span>
          }
          trailing={<SidebarCreateMenu />}
        />
        <SidebarNavLink
          to={CUSTOMIZE_PATH}
          label={t(I18nKey.NAV$CUSTOMIZE)}
          testId="sidebar-skills-link"
          collapsed={collapsed}
          forceActive={isExtensionsActive}
          icon={<CustomizeBoxesIcon width={ICON_SIZE} height={ICON_SIZE} />}
        />
        {!isCloudBackend && (
          <SidebarNavLink
            to={APPS_PATH}
            label={t(I18nKey.NAV$EXTENSIONS)}
            testId="sidebar-apps-link"
            collapsed={collapsed}
            icon={<Blocks width={ICON_SIZE} height={ICON_SIZE} />}
          />
        )}
        <SidebarNavLink
          to={FACTORY_PATH}
          label={t(I18nKey.NAV$FACTORY)}
          testId="sidebar-factory-link"
          collapsed={collapsed}
          forceActive={
            currentPath === FACTORY_PATH ||
            currentPath.startsWith("/automations/factories")
          }
          icon={<Factory width={ICON_SIZE} height={ICON_SIZE} />}
        />
        <SidebarNavLink
          to={AGENTS_PATH}
          label={t(I18nKey.NAV$AGENTS)}
          testId="sidebar-agents-link"
          collapsed={collapsed}
          icon={<Bot width={ICON_SIZE} height={ICON_SIZE} />}
        />
        {/* The interface manifest owns this entry's label, so an absent
            manifest leaves the rail without it rather than with host copy. */}
        {hasAutomationInterface() && (
          <SidebarNavLink
            to={automationListPath()}
            label={getInterfaceCopy().sidebarLabel}
            testId="sidebar-automations-link"
            collapsed={collapsed}
            icon={<AutomationsIcon width={ICON_SIZE} height={ICON_SIZE} />}
          />
        )}
        <SidebarAppsList collapsed={collapsed} />
      </nav>

      <SidebarConversationList collapsed={collapsed} />

      {collapsed && showCollapseToggle ? (
        <nav
          className={cn(
            sidebarNavListClassName(collapsed),
            "mt-auto pb-2 cursor-pointer",
          )}
        >
          <StyledTooltip
            content={t(I18nKey.SIDEBAR$SETTINGS)}
            placement="right"
          >
            {isCloudBackend && cloudSettingsUrl ? (
              <a
                href={cloudSettingsUrl}
                target={isLockedToCloud ? undefined : "_blank"}
                rel={isLockedToCloud ? undefined : "noopener noreferrer"}
                data-testid="collapsed-settings-link"
                aria-label={t(I18nKey.SIDEBAR$SETTINGS)}
                className={sidebarNavRowClassName({ collapsed: true })}
              >
                <SidebarCollapsedIconSlot active={false}>
                  <Settings width={ICON_SIZE} height={ICON_SIZE} />
                </SidebarCollapsedIconSlot>
                <span className={sidebarNavLabelClassName(true)}>
                  {t(I18nKey.SIDEBAR$SETTINGS)}
                </span>
              </a>
            ) : (
              <NavigationLink
                to="/settings"
                data-testid="collapsed-settings-link"
                aria-label={t(I18nKey.SIDEBAR$SETTINGS)}
                className={sidebarNavRowClassName({ collapsed: true })}
              >
                <SidebarCollapsedIconSlot
                  active={currentPath.startsWith("/settings")}
                >
                  <Settings width={ICON_SIZE} height={ICON_SIZE} />
                </SidebarCollapsedIconSlot>
                <span className={sidebarNavLabelClassName(true)}>
                  {t(I18nKey.SIDEBAR$SETTINGS)}
                </span>
              </NavigationLink>
            )}
          </StyledTooltip>
          <div
            className="relative"
            ref={collapsedBackendPopoverRef}
            onMouseEnter={() => {
              if (backendCloseTimerRef.current) {
                clearTimeout(backendCloseTimerRef.current);
                backendCloseTimerRef.current = null;
              }
              setCollapsedBackendPopoverOpen(true);
            }}
            onMouseLeave={() => {
              backendCloseTimerRef.current = setTimeout(
                () => setCollapsedBackendPopoverOpen(false),
                150,
              );
            }}
          >
            <button
              type="button"
              data-testid="collapsed-backend-selector-link"
              aria-label={t(I18nKey.BACKEND$MANAGE)}
              aria-expanded={collapsedBackendPopoverOpen}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onMouseUp={(event) => event.stopPropagation()}
              className={cn(
                sidebarNavRowClassName({ collapsed: true }),
                "relative",
              )}
            >
              <SidebarCollapsedIconSlot active={collapsedBackendPopoverOpen}>
                <span className="relative inline-flex size-4.5 shrink-0 items-center justify-center">
                  <BackendStatusDot
                    isConnected={activeBackendHealth?.isConnected ?? null}
                    className="absolute -left-0.5 -top-0.5 z-[1] pointer-events-none"
                  />
                  <Server width={ICON_SIZE} height={ICON_SIZE} />
                </span>
              </SidebarCollapsedIconSlot>
              <span className={sidebarNavLabelClassName(true)}>
                {t(I18nKey.BACKEND$MANAGE)}
              </span>
            </button>
            {collapsedBackendPopoverOpen ? (
              <div
                className="absolute bottom-[-4px] left-full pl-2.5 z-40 w-68"
                onClick={(event) => event.stopPropagation()}
              >
                <BackendSelector
                  sidebarCollapsed={collapsed}
                  hideTrigger
                  defaultOpen
                  openUpward
                  onSelectOption={() => setCollapsedBackendPopoverOpen(false)}
                  onOpenAddBackend={onOpenAddBackend}
                  onOpenManageBackends={onOpenManageBackends}
                />
              </div>
            ) : null}
          </div>
        </nav>
      ) : null}

      {!collapsed ? (
        <>
          <div className="flex flex-col gap-2 mb-2 shrink-0 pr-2.5">
            <SidebarFloatingUpdate collapsed={collapsed} />
            <SidebarOnboardingChecklist collapsed={collapsed} />
          </div>
          <div
            className={cn(
              "flex flex-col items-stretch max-w-none box-border shrink-0 gap-2",
              "-ml-2.5 w-[calc(100%+0.625rem)] border-t border-t-[0.5px] border-border pt-2 px-2.5",
            )}
          >
            {userName ? (
              <div
                data-testid="sidebar-footer-user-name"
                className="truncate px-2 text-sm font-medium text-contrast"
              >
                {userName}
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <SidebarSettingsPopover
                backendId={activeBackend.id}
                userEmail={userEmail}
              />
              {showCollapseToggle ? (
                <button
                  type="button"
                  data-testid="sidebar-collapse-toggle"
                  aria-pressed={collapsed}
                  aria-label={collapseToggleLabel}
                  onClick={onCollapse}
                  className={cn(
                    "hidden md:inline-flex shrink-0",
                    SIDEBAR_ICON_BUTTON_CLASS,
                    "text-muted hover:text-contrast hover:bg-surface-raised",
                  )}
                >
                  <PanelLeftClose width={18} height={18} aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
