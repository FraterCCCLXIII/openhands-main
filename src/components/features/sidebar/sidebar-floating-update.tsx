import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpCircle, X } from "lucide-react";
import { compareAgentServerVersions } from "#/api/agent-server-compatibility";
import { getLockedCloudHost } from "#/api/agent-server-config";
import { AGENT_CANVAS_CLIENT_VERSION } from "#/api/client-source";
import { useLatestAgentCanvasVersion } from "#/hooks/query/use-latest-agent-canvas-version";
import { I18nKey } from "#/i18n/declaration";
import { useDismissedUpdateStore } from "#/stores/dismissed-update-store";
import { cn } from "#/utils/utils";
import { AgentCanvasVersionModal } from "#/components/features/settings/agent-canvas-version-modal";

interface SidebarFloatingUpdateProps {
  collapsed: boolean;
}

/**
 * Floating update notification that appears above the onboarding checklist
 * when an update is available. Styled similar to the onboarding checklist card.
 */
export function SidebarFloatingUpdate({
  collapsed,
}: SidebarFloatingUpdateProps) {
  const { t } = useTranslation("openhands");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const dismissedVersion = useDismissedUpdateStore((state) => state.version);
  const dismiss = useDismissedUpdateStore((state) => state.dismiss);
  const isLockedToCloud = getLockedCloudHost() !== null;
  const latestVersionQuery = useLatestAgentCanvasVersion({
    enabled: !isLockedToCloud,
  });

  if (isLockedToCloud || collapsed) return null;

  const installedVersion = AGENT_CANVAS_CLIENT_VERSION;
  const latestVersion = latestVersionQuery.data ?? null;
  const comparison =
    latestVersion !== null
      ? compareAgentServerVersions(latestVersion, installedVersion)
      : null;
  const updateAvailable = comparison === 1;

  if (!updateAvailable || latestVersion === dismissedVersion) return null;

  return (
    <>
      <div className="group relative w-full shrink-0">
        <button
          type="button"
          data-testid="sidebar-floating-update"
          onClick={() => setIsModalOpen(true)}
          aria-label={t(I18nKey.SETTINGS$VERSION_TILE_ARIA_LABEL)}
          className={cn(
            "w-full shrink-0 overflow-hidden rounded-xl border border-border",
            "bg-surface-raised shadow-[0_4px_12px_rgb(0_0_0/0.18)]",
            "flex items-center gap-3 px-3 py-2.5 text-left",
            "hover:bg-surface transition-colors",
          )}
        >
          <ArrowUpCircle
            className="size-5 shrink-0 text-info dark:text-[#3B82F6]"
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-5 text-contrast">
              {t(I18nKey.SETTINGS$VERSION_TILE_NEW_VERSION)}
            </span>
            <span className="flex min-w-0 items-center gap-1.5 truncate text-xs leading-5">
              <span className="text-muted">
                {t(I18nKey.SETTINGS$APP_UPDATE_VERSION_LABEL)}
              </span>
              <span className="truncate text-contrast">{latestVersion}</span>
            </span>
          </span>
        </button>
        <button
          type="button"
          data-testid="sidebar-floating-update-close"
          aria-label={t(I18nKey.BUTTON$CLOSE)}
          onClick={() => latestVersion && dismiss(latestVersion)}
          className={cn(
            "absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full",
            "bg-surface text-muted hover:text-contrast",
            "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          <X size={12} aria-hidden />
        </button>
      </div>

      {isModalOpen ? (
        <AgentCanvasVersionModal
          installedVersion={installedVersion}
          latestVersion={latestVersion}
          updateAvailable={updateAvailable}
          isChecking={latestVersionQuery.isFetching}
          onCheckForUpdates={() => {
            void latestVersionQuery.refetch();
          }}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </>
  );
}
