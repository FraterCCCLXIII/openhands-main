import React from "react";
import { useTranslation } from "react-i18next";
import { useMatch, useNavigate } from "react-router";
import { Cloud, LayoutGrid, Plus, Settings } from "lucide-react";
import OpenHandsLogo from "#/assets/branding/openhands-logo.svg?react";
import { Dropdown } from "#/ui/dropdown/dropdown";
import { DropdownOption } from "#/ui/dropdown/types";
import { getLockedCloudHost } from "#/api/agent-server-config";
import { isNoBackend } from "#/api/backend-registry/active-store";
import { useActiveBackendContext } from "#/contexts/active-backend-context";
import { useAllCloudOrganizations } from "#/hooks/query/use-cloud-organizations";
import { useCloudCurrentUserId } from "#/hooks/query/use-cloud-current-user-id";
import {
  useBackendsHealth,
  type BackendHealth,
} from "#/hooks/query/use-backends-health";
import { I18nKey } from "#/i18n/declaration";
import type { Backend } from "#/api/backend-registry/types";
// Import the trigger helpers from the lightweight store, not the overlay
// component, so the eagerly-mounted sidebar/backend-selector graph does not
// pull in the overlay's render code (the overlay is lazy-loaded from
// `routes/root-layout.tsx`).
import {
  ENVIRONMENT_SWITCH_SETACTIVE_DELAY_MS,
  triggerEnvironmentSwitch,
} from "#/components/features/backends/environment-switch-store";
import { NavigationLink } from "#/components/shared/navigation-link";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";
import { useConversationStore } from "#/stores/conversation-store";
import { AddBackendModal } from "./add-backend-modal";
import { DetectedBackendsMenuSection } from "./detected-backends-menu-section";
import { useAddBackendPrefillStore } from "#/stores/add-backend-prefill-store";
import type { DetectedBackend } from "#/api/detect-local-backends";
import { BackendDropdownRowMenu } from "./backend-dropdown-row-menu";
import { BackendStatusDot } from "./backend-status-dot";
import { EditableAccountIdentityTile } from "./backend-identity-editable-tile";
import { getBackendIdentityKey } from "#/stores/backend-identity-store";
import { useBackendTileViewStore } from "#/stores/backend-tile-view-store";
import { ManageBackendsModal } from "./manage-backends-modal";
import { cn } from "#/utils/utils";
import { formControlTransitionClassName } from "#/utils/form-control-classes";
import {
  dropdownFooterActionClassName,
  dropdownMenuListClassName,
  dropdownMenuRowIconWrapperClassName,
} from "#/utils/dropdown-classes";

const VALUE_SEPARATOR = "::";

export function makeOptionValue(
  backendId: string,
  orgId: string | null,
): string {
  return getBackendIdentityKey(backendId, orgId);
}

export function parseOptionValue(value: string): {
  backendId: string;
  orgId: string | null;
} {
  const [backendId, orgId] = value.split(VALUE_SEPARATOR);
  return { backendId, orgId: orgId ?? null };
}

/** Icon for an account with no picked identity: a server or a cloud. */
export function accountFallbackIcon(kind: Backend["kind"] | undefined) {
  if (kind === "cloud") {
    return (
      <Cloud aria-hidden width={16} height={16} className="!text-contrast" />
    );
  }
  return (
    <OpenHandsLogo
      aria-hidden
      width={16}
      height={16}
      className="!text-contrast [&_path[fill=white]]:fill-current"
    />
  );
}

function buildStatusPrefix(health: BackendHealth | undefined) {
  return <BackendStatusDot isConnected={health?.isConnected ?? null} />;
}

function buildNoBackendPrefix() {
  return <BackendStatusDot isConnected="unavailable" />;
}

function buildOptions(
  registered: Backend[],
  personalWorkspaceLabel: string,
  cloudOrgs: ReturnType<typeof useAllCloudOrganizations>,
  currentUserIds: ReturnType<typeof useCloudCurrentUserId>,
  healthByBackendId: Record<string, BackendHealth>,
): DropdownOption[] {
  const options: DropdownOption[] = [];

  const locals = registered.filter((b) => b.kind === "local");
  const clouds = registered.filter((b) => b.kind === "cloud");
  // With a single backend (e.g. a Canvas locked to one cloud) the backend
  // name tells the rows nothing, so give the org name the full width.
  const showBackendName = registered.length > 1;

  for (const b of locals) {
    options.push({
      value: makeOptionValue(b.id, null),
      label: b.name,
      prefix: buildStatusPrefix(healthByBackendId[b.id]),
    });
  }

  for (const b of clouds) {
    const entry = cloudOrgs[b.id];
    const prefix = buildStatusPrefix(healthByBackendId[b.id]);
    if (!entry || entry.orgs.length === 0) {
      options.push({
        value: makeOptionValue(b.id, null),
        label: b.name,
        prefix,
      });
    } else {
      // Personal-workspace rule (per the cloud contract): the org whose
      // id matches the calling user's id is the user's personal
      // workspace. We resolve `user_id` once per backend (via /me on any
      // one org) and apply it across all orgs of that backend.
      const userIdForBackend = currentUserIds[b.id]?.userId ?? null;

      for (const org of entry.orgs) {
        const isPersonal = !!userIdForBackend && userIdForBackend === org.id;
        const orgLabel = isPersonal ? personalWorkspaceLabel : org.name;
        options.push({
          value: makeOptionValue(b.id, org.id),
          label: showBackendName ? `${b.name} – ${orgLabel}` : orgLabel,
          // All org rows for the same cloud backend share that backend's
          // single connectivity verdict — there is no per-org probe.
          prefix,
        });
      }
    }
  }

  return options;
}

/** The selectable accounts (one per backend, or per org on a Cloud backend). */
export function useBackendOptions() {
  const { t } = useTranslation("openhands");
  const { backends } = useActiveBackendContext();
  const cloudOrgs = useAllCloudOrganizations();
  const currentUserIds = useCloudCurrentUserId();
  // Probe each registered backend every 10s.
  const healthByBackendId = useBackendsHealth(backends);
  const personalWorkspaceLabel = t(I18nKey.BACKEND$PERSONAL_WORKSPACE);
  const options = React.useMemo(
    () =>
      buildOptions(
        backends,
        personalWorkspaceLabel,
        cloudOrgs,
        currentUserIds,
        healthByBackendId,
      ),
    [
      backends,
      personalWorkspaceLabel,
      cloudOrgs,
      currentUserIds,
      healthByBackendId,
    ],
  );
  return { backends, options, cloudOrgs, healthByBackendId };
}

/** Switches the active account, keeping the user on the same page. */
export function useSelectBackendOption(
  options: DropdownOption[],
  onSelectOption?: () => void,
) {
  const { backends, active, setActive } = useActiveBackendContext();
  const navigate = useNavigate();
  const conversationMatch = useMatch("/conversations/:conversationId");
  const automationDetailMatch = useMatch("/automations/:automationId");
  const activeValue = makeOptionValue(active.backend.id, active.orgId);

  return React.useCallback(
    async (value: string) => {
      if (value === activeValue) return;

      const { backendId, orgId } = parseOptionValue(value);
      const target = backends.find((b) => b.id === backendId);
      if (!target) return;

      triggerEnvironmentSwitch(
        options.find((option) => option.value === value)?.label ?? target.name,
      );
      await new Promise<void>((resolve) => {
        setTimeout(resolve, ENVIRONMENT_SWITCH_SETACTIVE_DELAY_MS);
      });

      // @spec BM-002 — Switching backends keeps the user on the same page
      if (conversationMatch) navigate("/conversations");
      else if (automationDetailMatch) navigate("/automations");

      setActive(target.id, orgId);
      onSelectOption?.();
    },
    [
      activeValue,
      backends,
      conversationMatch,
      automationDetailMatch,
      navigate,
      options,
      setActive,
      onSelectOption,
    ],
  );
}

interface BackendSelectorProps {
  /** Render the menu above the trigger (e.g. when pinned to bottom of sidebar). */
  openUpward?: boolean;
  /** Hide the selector input trigger and only render the dropdown menu. */
  hideTrigger?: boolean;
  /** Whether the dropdown menu should start open on mount. */
  defaultOpen?: boolean;
  /** Callback fired after selecting a backend/org option. */
  onSelectOption?: () => void;
  /**
   * Override the internal Add Backend modal handling. When provided,
   * clicking "Add Backend" calls this instead of opening BackendSelector's
   * own modal. Useful when the selector is mounted inside an ephemeral
   * container (e.g. the collapsed-sidebar popover) and the modal must
   * survive the parent unmounting.
   */
  onOpenAddBackend?: () => void;
  /** Same as onOpenAddBackend but for the Manage Backends modal. */
  onOpenManageBackends?: () => void;
  /**
   * Render the active account as an identity tile plus name in place of the
   * logo, with the account menu opening from it.
   */
  identityHeader?: boolean;
  /**
   * Whether the surrounding sidebar rail is in its collapsed variant. Passed
   * down from `SidebarRailBody` so the mobile drawer (which always renders
   * the expanded rail) can override the persisted desktop value.
   */
  sidebarCollapsed?: boolean;
}

export function BackendSelector({
  openUpward = false,
  hideTrigger = false,
  defaultOpen = false,
  onSelectOption,
  onOpenAddBackend,
  onOpenManageBackends,
  sidebarCollapsed = false,
  identityHeader = false,
}: BackendSelectorProps = {}) {
  const { t } = useTranslation("openhands");
  const { active } = useActiveBackendContext();
  const { backends, options, cloudOrgs, healthByBackendId } =
    useBackendOptions();
  const settingsMatch = useMatch("/settings");
  const settingsSubrouteMatch = useMatch("/settings/*");
  const conversationMatch = useMatch("/conversations/:conversationId");
  const [addBackendModalOpen, setAddBackendModalOpen] = React.useState(false);
  const [manageBackendsModalOpen, setManageBackendsModalOpen] =
    React.useState(false);

  const tileViewEnabled = useBackendTileViewStore((state) => state.enabled);
  const toggleTileView = useBackendTileViewStore((state) => state.toggle);

  const openManageBackendsModal = React.useCallback(() => {
    if (onOpenManageBackends) {
      onOpenManageBackends();
      onSelectOption?.();
      return;
    }
    setManageBackendsModalOpen(true);
  }, [onOpenManageBackends, onSelectOption]);

  // In the header the account's tile replaces the status dot on every row, so
  // the menu and the trigger show the same icon the user picked for it.
  const headerOptions = React.useMemo(
    () =>
      identityHeader
        ? options.map((option) => {
            const backendId = option.value.split(VALUE_SEPARATOR)[0];
            const kind = backends.find((b) => b.id === backendId)?.kind;
            return {
              ...option,
              prefix: (
                <span className="relative inline-flex shrink-0">
                  <EditableAccountIdentityTile
                    identityKey={option.value}
                    fallback={accountFallbackIcon(kind)}
                    size="sm"
                  />
                  <BackendStatusDot
                    isConnected={
                      healthByBackendId[backendId]?.isConnected ?? null
                    }
                    className="absolute -right-0.5 -top-0.5 z-[1]"
                  />
                </span>
              ),
              suffix: (
                <BackendDropdownRowMenu onManage={openManageBackendsModal} />
              ),
            };
          })
        : options,
    [
      identityHeader,
      options,
      backends,
      healthByBackendId,
      openManageBackendsModal,
    ],
  );

  const noBackendSelected = isNoBackend(active.backend);
  const noBackendLabel = t(I18nKey.BACKEND$NO_BACKEND_AVAILABLE);
  const activeValue = makeOptionValue(active.backend.id, active.orgId);
  const activeOption = noBackendSelected
    ? undefined
    : options.find((o) => o.value === activeValue);
  const isSettingsActive = Boolean(settingsMatch || settingsSubrouteMatch);
  const settingsLabel = t(I18nKey.SIDEBAR$SETTINGS);
  // `org` is consumed by the cloud settings loader so the page opens on the
  // org that is active here instead of the cloud's last-used org.
  const cloudSettingsOrgQuery = active.orgId
    ? `?org=${encodeURIComponent(active.orgId)}`
    : "";
  const isRightPanelShown = useConversationStore(
    (state) => state.isRightPanelShown,
  );
  // When the sidebar rail is expanded, `placement="left"` hugs the main
  // canvas and reads awkwardly; prefer above the control. When the rail is
  // collapsed, keep left except on active conversation + open right drawer.
  const settingsTooltipPlacement =
    !sidebarCollapsed || (conversationMatch && isRightPanelShown)
      ? "top"
      : "left";

  const someCloudLoading = Object.values(cloudOrgs).some((c) => c.isLoading);

  const openAddBackendModal = React.useCallback(() => {
    if (onOpenAddBackend) {
      onOpenAddBackend();
      onSelectOption?.();
      return;
    }
    setAddBackendModalOpen(true);
  }, [onOpenAddBackend, onSelectOption]);

  const isLockedToCloud = getLockedCloudHost() !== null;
  // A cookie-auth (OHE-hosted) Canvas has nothing to add, manage, or
  // reconnect — its single locked backend is owned by the main-app session.
  const hideBackendFooter =
    isLockedToCloud && active.backend.authMode === "cookie";

  const preventDropdownMenuClose = React.useCallback(
    (event: React.SyntheticEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    [],
  );

  const handleAddBackendClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      preventDropdownMenuClose(event);
      openAddBackendModal();
    },
    [openAddBackendModal, preventDropdownMenuClose],
  );

  const handleAddBackendTouchEnd = React.useCallback(
    (event: React.TouchEvent<HTMLButtonElement>) => {
      preventDropdownMenuClose(event);
      openAddBackendModal();
    },
    [openAddBackendModal, preventDropdownMenuClose],
  );

  const setAddBackendPrefill = useAddBackendPrefillStore(
    (state) => state.setPrefill,
  );
  const handleDetectedBackendPick = React.useCallback(
    (backend: DetectedBackend) => {
      setAddBackendPrefill({
        name: t(I18nKey.BACKEND$DETECTED_DEFAULT_NAME),
        host: backend.host,
      });
      openAddBackendModal();
    },
    [openAddBackendModal, setAddBackendPrefill, t],
  );

  const handleManageBackendsClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      preventDropdownMenuClose(event);
      openManageBackendsModal();
    },
    [openManageBackendsModal, preventDropdownMenuClose],
  );

  const handleManageBackendsTouchEnd = React.useCallback(
    (event: React.TouchEvent<HTMLButtonElement>) => {
      preventDropdownMenuClose(event);
      openManageBackendsModal();
    },
    [openManageBackendsModal, preventDropdownMenuClose],
  );

  const addBackendFooter = hideBackendFooter ? undefined : (
    <>
      {isLockedToCloud ? null : (
        <DetectedBackendsMenuSection
          onPick={handleDetectedBackendPick}
          preventClose={preventDropdownMenuClose}
        />
      )}
      <div className={dropdownMenuListClassName}>
        {isLockedToCloud ? null : (
          <button
            type="button"
            data-testid="add-backend-menu-item"
            onMouseDown={preventDropdownMenuClose}
            onTouchStart={preventDropdownMenuClose}
            onTouchEnd={handleAddBackendTouchEnd}
            onClick={handleAddBackendClick}
            className={cn(
              dropdownFooterActionClassName,
              "cursor-pointer rounded-md",
            )}
          >
            <span className={dropdownMenuRowIconWrapperClassName} aria-hidden>
              <Plus width={16} height={16} />
            </span>
            {t(I18nKey.BACKEND$ADD)}
          </button>
        )}
        {identityHeader ? (
          <button
            type="button"
            data-testid="left-rail-menu-item"
            aria-pressed={tileViewEnabled}
            onMouseDown={preventDropdownMenuClose}
            onTouchStart={preventDropdownMenuClose}
            onClick={(event) => {
              preventDropdownMenuClose(event);
              toggleTileView();
            }}
            className={cn(
              dropdownFooterActionClassName,
              "cursor-pointer rounded-md",
            )}
          >
            <span className={dropdownMenuRowIconWrapperClassName} aria-hidden>
              <LayoutGrid width={16} height={16} />
            </span>
            {t(I18nKey.BACKEND$LEFT_RAIL)}
          </button>
        ) : null}
        <button
          type="button"
          data-testid="manage-backends-menu-item"
          onMouseDown={preventDropdownMenuClose}
          onTouchStart={preventDropdownMenuClose}
          onTouchEnd={handleManageBackendsTouchEnd}
          onClick={handleManageBackendsClick}
          className={cn(
            dropdownFooterActionClassName,
            "cursor-pointer rounded-md",
          )}
        >
          <span className={dropdownMenuRowIconWrapperClassName} aria-hidden>
            <Settings width={16} height={16} />
          </span>
          {t(
            isLockedToCloud
              ? I18nKey.BACKEND$RECONNECT_CLOUD
              : I18nKey.BACKEND$MANAGE,
          )}
        </button>
      </div>
    </>
  );

  const handleSelectBackend = useSelectBackendOption(options, onSelectOption);

  return (
    <>
      <div className="group relative flex items-center gap-2 w-full">
        <div className="flex-1 min-w-0">
          <Dropdown
            testId="backend-selector"
            italicPlaceholder={false}
            key={`${activeValue}-${activeOption?.label ?? ""}`}
            defaultValue={
              activeOption ?? {
                value: activeValue,
                label: noBackendSelected ? noBackendLabel : active.backend.name,
                prefix: noBackendSelected
                  ? buildNoBackendPrefix()
                  : buildStatusPrefix(healthByBackendId[active.backend.id]),
              }
            }
            footer={addBackendFooter}
            openUpward={openUpward}
            hideTrigger={hideTrigger}
            defaultOpen={defaultOpen}
            openOnHover={!hideTrigger}
            onChange={(item) => {
              if (!item) return;
              void handleSelectBackend(item.value);
            }}
            placeholder={
              noBackendSelected
                ? noBackendLabel
                : (activeOption?.label ?? active.backend.name)
            }
            loading={someCloudLoading}
            options={headerOptions}
            className="-ml-2.5 w-[calc(100%+0.625rem)] h-10 [&_input]:text-[15px] [&_input]:font-normal [&_input::placeholder]:text-contrast text-contrast [&_[data-testid=dropdown-trigger]]:text-muted pl-1.5 pr-2 py-0 bg-base-secondary border-transparent hover:bg-surface-raised focus-within:bg-surface-raised focus-within:border-transparent focus-within:ring-0"
          />
        </div>
        {identityHeader ? (
          <NavigationLink
            to="/settings"
            data-testid="backend-selector-header-settings"
            aria-label={settingsLabel}
            className="absolute right-9 top-1/2 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md bg-surface-raised text-muted opacity-0 transition-opacity hover:text-contrast group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Settings width={16} height={16} />
          </NavigationLink>
        ) : null}
        {!hideTrigger && !identityHeader ? (
          <StyledTooltip
            content={settingsLabel}
            placement={settingsTooltipPlacement}
            offset={10}
          >
            {active.backend.kind === "cloud" ? (
              <a
                href={`${active.backend.host.replace(/\/+$/, "")}/settings${cloudSettingsOrgQuery}`}
                target={isLockedToCloud ? undefined : "_blank"}
                rel={isLockedToCloud ? undefined : "noopener noreferrer"}
                data-testid="backend-selector-settings-link"
                aria-label={settingsLabel}
                className={cn(
                  "inline-flex items-center justify-center shrink-0 w-9 h-9 rounded-md text-muted hover:text-contrast hover:bg-surface-raised cursor-pointer",
                  formControlTransitionClassName,
                )}
              >
                <Settings width={16} height={16} />
              </a>
            ) : (
              <NavigationLink
                to="/settings"
                data-testid="backend-selector-settings-link"
                data-active={isSettingsActive}
                aria-label={settingsLabel}
                className={
                  isSettingsActive
                    ? cn(
                        "inline-flex items-center justify-center shrink-0 w-9 h-9 rounded-md bg-tertiary text-contrast font-normal cursor-pointer",
                        formControlTransitionClassName,
                      )
                    : cn(
                        "inline-flex items-center justify-center shrink-0 w-9 h-9 rounded-md text-muted hover:text-contrast hover:bg-surface-raised cursor-pointer",
                        formControlTransitionClassName,
                      )
                }
              >
                <Settings width={16} height={16} />
              </NavigationLink>
            )}
          </StyledTooltip>
        ) : null}
      </div>
      {addBackendModalOpen ? (
        <AddBackendModal onClose={() => setAddBackendModalOpen(false)} />
      ) : null}
      {manageBackendsModalOpen ? (
        <ManageBackendsModal
          onClose={() => setManageBackendsModalOpen(false)}
        />
      ) : null}
    </>
  );
}
