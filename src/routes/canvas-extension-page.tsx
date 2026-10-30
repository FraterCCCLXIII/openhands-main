import React from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { useCanvasExtensionsRuntime } from "#/components/features/canvas-extensions/canvas-extensions-runtime";
import { useExtensionPageMount } from "#/components/features/canvas-extensions/extension-page-host";
import { AppTurnedOffPage } from "#/components/features/built-in-apps/app-turned-off-page";
import { useCanvasExtensions } from "#/hooks/query/use-canvas-extensions";
import { I18nKey } from "#/i18n/declaration";

// @spec CE-010 — A route for an app that is off or missing explains itself
export default function CanvasExtensionPage() {
  const { t } = useTranslation("openhands");
  const params = useParams();
  const navigate = useNavigate();
  const extensionName = params.extensionName ?? "";
  const routePath = params["*"] ?? "";
  const { pages, activating, errors } = useCanvasExtensionsRuntime();
  const installed = useCanvasExtensions().data;
  const installedExtension = installed?.find(
    (candidate) => candidate.name === extensionName,
  );
  const page = React.useMemo(
    () =>
      pages
        .filter((candidate) => candidate.extension.name === extensionName)
        .sort(
          (left, right) =>
            right.contribution.path.length - left.contribution.path.length,
        )
        .find(
          (candidate) =>
            routePath === candidate.contribution.path ||
            routePath.startsWith(`${candidate.contribution.path}/`),
        ),
    [extensionName, pages, routePath],
  );
  const remainder = page
    ? routePath.slice(page.contribution.path.length).replace(/^\/+/, "")
    : "";
  const { containerRef, mountError } = useExtensionPageMount(
    page,
    remainder,
    navigate,
  );

  if (activating && !page) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Installed but switched off, or not installed at all: say so and point at
  // Customize > Apps instead of the generic unavailable card.
  if (!page && installed) {
    if (!installedExtension) {
      return <AppTurnedOffPage name={extensionName} reason="missing" />;
    }
    if (!installedExtension.enabled) {
      return (
        <AppTurnedOffPage
          name={installedExtension.manifest?.display_name || extensionName}
        />
      );
    }
  }

  const error = mountError ?? errors.get(extensionName);
  if (error || !page) {
    return (
      <main className="flex h-full items-center justify-center p-8">
        <div className="max-w-lg rounded-xl border border-border bg-base-secondary p-6 text-center">
          <h1 className="text-lg font-semibold text-contrast">
            {t(I18nKey.SETUP$UNAVAILABLE_TITLE)}
          </h1>
          <p className="mt-2 text-sm text-tertiary-light">
            {error || t(I18nKey.SETTINGS$APPS_PAGE_UNAVAILABLE)}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      aria-label={page.contribution.title}
      className="h-full min-h-0 overflow-auto"
    >
      <div ref={containerRef} className="min-h-full" />
    </main>
  );
}
