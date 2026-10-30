import React from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { findBuiltInAppForPath } from "#/built-in-apps/registry";
import {
  isBuiltInAppEnabled,
  useBuiltInAppsBackendId,
  useBuiltInAppsStore,
} from "#/stores/built-in-apps-store";
import { AppTurnedOffPage } from "./app-turned-off-page";

// @spec CE-011 — Built-in apps share the switch model
/**
 * Wraps the root layout's outlet. When the current route belongs to a built-in
 * app that is switched off, it renders the "turned off" page instead of the
 * route; every other route (including core ones) passes straight through.
 * Nothing here unmounts or resets the app's data stores.
 */
export function BuiltInAppRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation("openhands");
  const { pathname } = useLocation();
  const backendId = useBuiltInAppsBackendId();
  const app = findBuiltInAppForPath(pathname);
  const enabled = useBuiltInAppsStore((state) =>
    app ? isBuiltInAppEnabled(state.byBackend, backendId, app.id) : true,
  );

  if (app && !enabled) return <AppTurnedOffPage name={t(app.nameKey)} />;
  return <>{children}</>;
}
