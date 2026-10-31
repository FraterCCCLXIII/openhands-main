import {
  PAGE_TITLE_CLASS_NAME,
  PAGE_SUBTITLE_CLASS_NAME,
} from "#/components/shared/page-title";
import React from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { AddCanvasExtensionModal } from "#/components/features/canvas-extensions/add-canvas-extension-modal";
import { CanvasExtensionDetailsModal } from "#/components/features/canvas-extensions/canvas-extension-details-modal";
import { useNavigation } from "#/context/navigation-context";
import { BuiltInAppsSection } from "#/components/features/built-in-apps/built-in-apps-section";
import { CanvasExtensionCard } from "#/components/features/canvas-extensions/canvas-extension-card";
import { BrandNotice } from "#/components/shared/brand-notice";
import { BrandButton } from "#/components/features/settings/brand-button";
import { ConfirmationModal } from "#/components/shared/modals/confirmation-modal";
import {
  CanvasExtensionsUnsupportedError,
  isCanvasExtensionsUnsupportedError,
} from "#/api/canvas-extensions-service";
import { isNoBackend } from "#/api/backend-registry/active-store";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { useCanvasExtensionsRuntime } from "#/components/features/canvas-extensions/canvas-extensions-runtime";
import { useCanvasExtensions } from "#/hooks/query/use-canvas-extensions";
import {
  useRefreshCanvasExtension,
  useSetCanvasExtensionEnabled,
  useUninstallCanvasExtension,
} from "#/hooks/mutation/use-manage-canvas-extensions";
import { AppsFilterRail } from "#/components/features/canvas-extensions/apps-filter-rail";
import { AppStoreCard } from "#/components/features/canvas-extensions/app-store-card";
import { useAppsFilters } from "#/hooks/use-apps-filters";
import { useKnownApps } from "#/hooks/query/use-known-apps";
import {
  applyFilters,
  buildEntries,
  facetCounts,
} from "#/utils/canvas-app-catalog";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { settingsLikeMainScrollClassName } from "#/utils/settings-like-page-layout-classes";
import {
  extensionModuleCardGridContainerClassName,
  extensionModuleEmptyStateClassName,
} from "#/utils/extension-module-card-classes";
import type { InstalledCanvasExtensionInfo } from "#/types/canvas-extension";

type PendingAction =
  | { type: "enable"; extension: InstalledCanvasExtensionInfo }
  | { type: "uninstall"; extension: InstalledCanvasExtensionInfo };

const CANVAS_EXTENSIONS_DOCS_URL =
  "https://docs.openhands.dev/openhands/usage/agent-canvas/canvas-extensions";

// @spec WN-001 — Apps trust notice uses theme-aware warning feedback
export default function CanvasExtensionsScreen() {
  const { t } = useTranslation("openhands");
  const { backend } = useActiveBackend();
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [isTrustNoticeDismissed, setIsTrustNoticeDismissed] =
    React.useState(false);
  const [detailsFor, setDetailsFor] =
    React.useState<InstalledCanvasExtensionInfo | null>(null);
  const { navigate } = useNavigation();
  const appsFilters = useAppsFilters();
  const knownApps = useKnownApps();
  const [pendingAction, setPendingAction] =
    React.useState<PendingAction | null>(null);
  const query = useCanvasExtensions();
  const { pages: appPages } = useCanvasExtensionsRuntime();
  const setEnabled = useSetCanvasExtensionEnabled();
  const uninstall = useUninstallCanvasExtension();
  const refresh = useRefreshCanvasExtension();

  const backendCanSupportExtensions =
    !isNoBackend(backend) && backend.kind === "local";
  const unsupported =
    !backendCanSupportExtensions ||
    isCanvasExtensionsUnsupportedError(query.error);
  const isBusy =
    setEnabled.isPending || uninstall.isPending || refresh.isPending;

  const isStore = appsFilters.view === "store";
  const entries = React.useMemo(
    () =>
      buildEntries(appsFilters.view, query.data ?? [], knownApps.data ?? []),
    [appsFilters.view, query.data, knownApps.data],
  );
  const counts = facetCounts(entries, appsFilters.filters);
  const visible = applyFilters(entries, appsFilters.filters);

  const confirmAction = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "enable") {
      setEnabled.mutate(
        { name: pendingAction.extension.name, enabled: true },
        { onSuccess: () => setPendingAction(null) },
      );
    } else {
      uninstall.mutate(pendingAction.extension.name, {
        onSuccess: () => setPendingAction(null),
      });
    }
  };

  const pendingDisplayName = pendingAction
    ? pendingAction.extension.manifest?.display_name ||
      pendingAction.extension.name
    : "";
  const confirmationText =
    pendingAction?.type === "enable"
      ? t(I18nKey.SETTINGS$APPS_ENABLE_CONFIRM)
      : pendingAction?.type === "uninstall"
        ? t(I18nKey.SETTINGS$APPS_UNINSTALL_CONFIRM, {
            name: pendingDisplayName,
          })
        : "";

  return (
    <div
      data-testid="canvas-extensions-screen"
      className="flex h-full gap-4 md:gap-6 md:pl-8 lg:gap-10 lg:pl-10"
    >
      <main className={cn(settingsLikeMainScrollClassName, "h-full")}>
        <div className="mx-auto flex w-full min-w-0 max-w-250 flex-col gap-6">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className={PAGE_TITLE_CLASS_NAME}>
                {t(I18nKey.SETTINGS$APPS_PAGE_TITLE)}
              </h1>
              <p className={PAGE_SUBTITLE_CLASS_NAME}>
                {t(I18nKey.SETTINGS$APPS_PAGE_DESCRIPTION)}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <a
                href={CANVAS_EXTENSIONS_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:opacity-90"
              >
                {t(I18nKey.SETTINGS$APPS_BUILD_LINK)}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
              <BrandButton
                type="button"
                variant="secondary"
                testId="canvas-extensions-add-button"
                isDisabled={
                  !backendCanSupportExtensions || unsupported || query.isLoading
                }
                className="flex-shrink-0 whitespace-nowrap"
                onClick={() => setShowAddModal(true)}
              >
                {t(I18nKey.SETTINGS$APPS_ADD_BUTTON)}
              </BrandButton>
            </div>
          </div>

          {isTrustNoticeDismissed ? null : (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-base-secondary px-4 py-3 text-sm text-muted">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <p className="min-w-0 flex-1">
                {t(I18nKey.SETTINGS$APPS_TRUST_NOTICE)}
              </p>
              <button
                type="button"
                aria-label={t(I18nKey.BUTTON$CLOSE)}
                onClick={() => setIsTrustNoticeDismissed(true)}
                className="shrink-0 rounded-md p-0.5 text-muted transition-colors hover:text-contrast"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )}

          <BuiltInAppsSection />

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <AppsFilterRail state={appsFilters} counts={counts} />
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <h3 className="text-lg font-bold text-contrast">
                {t(
                  isStore
                    ? I18nKey.SETTINGS$APPS_STORE
                    : I18nKey.SETTINGS$APPS_INSTALLED,
                )}
              </h3>
              {isStore ? (
                knownApps.isLoading ? (
                  <div className="h-40 animate-pulse rounded-xl bg-base-secondary" />
                ) : visible.length ? (
                  <div className={extensionModuleCardGridContainerClassName}>
                    <div className="grid min-w-0 grid-cols-1 gap-5 @min-[560px]:grid-cols-2">
                      {visible.map((entry) => (
                        <AppStoreCard key={entry.name} entry={entry} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={extensionModuleEmptyStateClassName}>
                    <p className="text-sm text-tertiary-light">
                      {t(
                        entries.length
                          ? I18nKey.SETTINGS$APPS_NO_MATCH
                          : I18nKey.SETTINGS$APPS_STORE_EMPTY,
                      )}
                    </p>
                  </div>
                )
              ) : unsupported ? (
                <div className={extensionModuleEmptyStateClassName}>
                  <h3 className="text-sm font-semibold text-contrast">
                    {t(I18nKey.SETUP$UNAVAILABLE_TITLE)}
                  </h3>
                  <p className="mt-2 text-sm text-tertiary-light">
                    {isCanvasExtensionsUnsupportedError(query.error)
                      ? query.error.message
                      : backend.kind === "cloud"
                        ? new CanvasExtensionsUnsupportedError("cloud-backend")
                            .message
                        : new CanvasExtensionsUnsupportedError("no-backend")
                            .message}
                  </p>
                </div>
              ) : query.isLoading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2].map((index) => (
                    <div
                      key={index}
                      className="h-40 animate-pulse rounded-xl bg-base-secondary"
                    />
                  ))}
                </div>
              ) : query.isError ? (
                <div className={extensionModuleEmptyStateClassName}>
                  <p className="text-sm text-tertiary-light">
                    {query.error instanceof Error
                      ? query.error.message
                      : t(I18nKey.ERROR$GENERIC)}
                  </p>
                  <BrandButton
                    type="button"
                    variant="secondary"
                    className="mt-4"
                    onClick={() => void query.refetch()}
                  >
                    {t(I18nKey.AUTOMATIONS$ERROR_RETRY)}
                  </BrandButton>
                </div>
              ) : query.data?.length && !visible.length ? (
                <div className={extensionModuleEmptyStateClassName}>
                  <p className="text-sm text-tertiary-light">
                    {t(I18nKey.SETTINGS$APPS_NO_MATCH)}
                  </p>
                </div>
              ) : query.data?.length ? (
                <div className={extensionModuleCardGridContainerClassName}>
                  <div className="grid min-w-0 grid-cols-1 gap-5 @min-[560px]:grid-cols-2">
                    {visible.map(
                      ({ installed: extension, pricing, license }) =>
                        extension && (
                          <CanvasExtensionCard
                            key={extension.name}
                            extension={extension}
                            pricing={pricing}
                            license={license}
                            openHref={
                              appPages.find(
                                (p) => p.extension.name === extension.name,
                              )?.href ?? null
                            }
                            isBusy={isBusy}
                            onToggle={() => {
                              if (extension.enabled) {
                                setEnabled.mutate({
                                  name: extension.name,
                                  enabled: false,
                                });
                              } else {
                                setPendingAction({ type: "enable", extension });
                              }
                            }}
                            onDetails={() => setDetailsFor(extension)}
                            onRefresh={() => refresh.mutate(extension)}
                            onUninstall={() =>
                              setPendingAction({ type: "uninstall", extension })
                            }
                          />
                        ),
                    )}
                  </div>
                </div>
              ) : (
                <div className={extensionModuleEmptyStateClassName}>
                  <p className="text-sm text-tertiary-light">
                    {t(I18nKey.SETTINGS$APPS_EMPTY)}
                  </p>
                </div>
              )}
            </div>
          </div>
          <BrandNotice className="mt-10 border-t border-border pt-4" />
        </div>
      </main>

      {detailsFor ? (
        <CanvasExtensionDetailsModal
          extension={detailsFor}
          openHref={
            appPages.find((p) => p.extension.name === detailsFor.name)?.href ??
            null
          }
          onOpen={() => {
            const href = appPages.find(
              (p) => p.extension.name === detailsFor.name,
            )?.href;
            if (href) {
              setDetailsFor(null);
              navigate(href);
            }
          }}
          onClose={() => setDetailsFor(null)}
        />
      ) : null}
      {showAddModal ? (
        <AddCanvasExtensionModal onClose={() => setShowAddModal(false)} />
      ) : null}
      {pendingAction ? (
        <ConfirmationModal
          title={
            pendingAction.type === "enable"
              ? t(I18nKey.SETTINGS$APPS_ENABLE_ACTION)
              : undefined
          }
          icon={
            pendingAction.type === "enable" ? (
              <ShieldAlert className="size-5" />
            ) : undefined
          }
          text={confirmationText}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmAction}
          confirmText={
            pendingAction.type === "enable"
              ? t(I18nKey.SETTINGS$APPS_ENABLE_ACTION)
              : undefined
          }
          isConfirming={isBusy}
        />
      ) : null}
    </div>
  );
}
