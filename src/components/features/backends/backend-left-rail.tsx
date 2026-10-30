import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import {
  Boxes,
  FolderKanban,
  KanbanSquare,
  Plus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { getLockedCloudHost } from "#/api/agent-server-config";
import { isNoBackend } from "#/api/backend-registry/active-store";
import { CanvasExtensionIcon } from "#/components/features/canvas-extensions/canvas-extension-icon";
import { useCanvasExtensionsRuntime } from "#/components/features/canvas-extensions/canvas-extensions-runtime";
import { useActiveBackendContext } from "#/contexts/active-backend-context";
import { I18nKey } from "#/i18n/declaration";
import { useBackendTileViewStore } from "#/stores/backend-tile-view-store";
import { cn } from "#/utils/utils";
import { isMacDesktopShell } from "#/utils/desktop-shell";
import { useDesktopFullScreen } from "#/hooks/use-desktop-full-screen";
import { AddBackendModal } from "./add-backend-modal";
import {
  AccountIdentityTile,
  BackendIdentityTile,
} from "./backend-identity-tile";
import { BackendStatusDot } from "./backend-status-dot";
import {
  accountFallbackIcon,
  makeOptionValue,
  parseOptionValue,
  useBackendOptions,
  useSelectBackendOption,
} from "./backend-selector";

interface RailApp {
  id: string;
  /** Name of the Canvas extension this slot opens. */
  extensionName: string;
  /** Label used only while the extension is not installed. */
  fallbackLabel: string;
  /** Glyph shown only while the extension is not installed. */
  fallbackIcon: LucideIcon;
}

/**
 * App slots under the accounts. Each opens a real Canvas extension page; the
 * name, icon and route come from the installed extension registry, so a slot
 * whose app is missing is disabled and says how to install it.
 */
const RAIL_APPS: readonly RailApp[] = [
  {
    id: "run-timeline",
    extensionName: "run-timeline",
    fallbackLabel: "Runner",
    fallbackIcon: ShieldCheck,
  },
  {
    id: "kosmos-roadmap",
    extensionName: "kosmos-roadmap",
    fallbackLabel: "Kosmos Roadmap",
    fallbackIcon: KanbanSquare,
  },
  {
    id: "projects-hub",
    extensionName: "projects-hub",
    fallbackLabel: "Projector",
    fallbackIcon: FolderKanban,
  },
  {
    id: "work-inventory",
    extensionName: "work-inventory",
    fallbackLabel: "Work inventory",
    fallbackIcon: Boxes,
  },
];

function RailAppButton({ app }: { app: RailApp }) {
  const { t } = useTranslation("openhands");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { pages } = useCanvasExtensionsRuntime();
  const page = pages.find((p) => p.extension.name === app.extensionName);
  const FallbackIcon = app.fallbackIcon;
  const label = page
    ? (page.contribution.nav_label ?? page.contribution.title)
    : app.fallbackLabel;
  const hint = t(I18nKey.BACKEND$RAIL_APP_NOT_INSTALLED, { app: label });
  const isActive = page
    ? pathname === page.href || pathname.startsWith(`${page.href}/`)
    : false;

  return (
    <button
      type="button"
      data-testid={`backend-rail-app-${app.id}`}
      aria-label={page ? label : `${label}. ${hint}`}
      aria-current={isActive ? "page" : undefined}
      aria-disabled={page ? undefined : true}
      title={page ? label : hint}
      onClick={page ? () => navigate(page.href) : undefined}
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl border-2 transition-colors",
        page
          ? "cursor-pointer hover:bg-surface-raised"
          : "cursor-not-allowed opacity-50",
        isActive ? "border-contrast" : "border-transparent",
      )}
    >
      {page ? (
        <CanvasExtensionIcon extension={page.extension} size={32} />
      ) : (
        <BackendIdentityTile
          fallback={<FallbackIcon aria-hidden className="size-4.5" />}
          size="md"
          className="bg-surface-raised text-muted"
        />
      )}
    </button>
  );
}

/**
 * A narrow rail down the left edge with one tile per account, so switching
 * accounts is a single click. The backend dropdown's "Left rail" item turns it
 * on and off.
 */
export function BackendLeftRail() {
  const { t } = useTranslation("openhands");
  const enabled = useBackendTileViewStore((state) => state.enabled);
  const { active } = useActiveBackendContext();
  const { backends, options, healthByBackendId } = useBackendOptions();
  const selectOption = useSelectBackendOption(options);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const isFullScreen = useDesktopFullScreen();
  // macOS desktop: the rail runs to the window's top edge and is wide enough
  // to hold the traffic lights, which sit in its top band.
  const showTitleBand = isMacDesktopShell() && !isFullScreen;

  if (!enabled) return null;

  const activeValue = isNoBackend(active.backend)
    ? null
    : makeOptionValue(active.backend.id, active.orgId);
  const canAdd = getLockedCloudHost() === null;

  return (
    <>
      <nav
        data-testid="backend-left-rail"
        aria-label={t(I18nKey.BACKEND$LEFT_RAIL)}
        className={cn(
          "hidden h-full w-14 shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-r-[0.5px] border-border bg-base-secondary md:flex",
          // py-3 would override a top-only padding (shorthand wins), so the
          // title band sets its own top and bottom padding.
          showTitleBand
            ? "app-region-drag pt-16 pb-3 md:-mt-7 md:h-[calc(100%+1.75rem)] md:w-20 [&>*]:app-region-no-drag"
            : "py-3",
        )}
      >
        {options.map((option) => {
          const { backendId } = parseOptionValue(option.value);
          const kind = backends.find((b) => b.id === backendId)?.kind;
          const isActive = option.value === activeValue;
          return (
            <button
              key={option.value}
              type="button"
              data-testid={`backend-rail-tile-${option.value}`}
              aria-label={option.label}
              aria-pressed={isActive}
              title={option.label}
              onClick={() => void selectOption(option.value)}
              className={cn(
                "relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 transition-colors",
                isActive
                  ? "border-contrast"
                  : "border-transparent hover:bg-surface-raised",
              )}
            >
              <AccountIdentityTile
                identityKey={option.value}
                fallback={accountFallbackIcon(kind)}
                size="md"
              />
              <BackendStatusDot
                isConnected={healthByBackendId[backendId]?.isConnected ?? null}
                className="absolute -right-0.5 -top-0.5 z-[1]"
              />
            </button>
          );
        })}
        {canAdd ? (
          <button
            type="button"
            data-testid="backend-rail-add"
            aria-label={t(I18nKey.BACKEND$ADD)}
            title={t(I18nKey.BACKEND$ADD)}
            onClick={() => setAddModalOpen(true)}
            className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-surface-raised hover:text-contrast"
          >
            <Plus aria-hidden className="size-5" />
          </button>
        ) : null}
        <div
          role="separator"
          aria-orientation="horizontal"
          className="my-1 h-px w-6 shrink-0 bg-border"
        />
        {RAIL_APPS.map((app) => (
          <RailAppButton key={app.id} app={app} />
        ))}
      </nav>
      {addModalOpen ? (
        <AddBackendModal onClose={() => setAddModalOpen(false)} />
      ) : null}
    </>
  );
}
