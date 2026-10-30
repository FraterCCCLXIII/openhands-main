import { matchPath } from "react-router";
import { I18nKey } from "#/i18n/declaration";

/**
 * The core registry of built-in apps that a person can switch on and off
 * (Customize > Apps). Core surfaces (chat, settings, Customize itself, the
 * Apps page) are deliberately NOT here: they can never be turned off.
 */
export type BuiltInAppId = "tower" | "factory" | "automations" | "commons";

export interface BuiltInApp {
  /** Stable id: persisted, so never rename it. */
  id: BuiltInAppId;
  /** Display name (also names the app on the "turned off" page). */
  nameKey: I18nKey;
  /** One-line description for the switch row. */
  descriptionKey: I18nKey;
  /** React Router patterns the app owns; each also matches sub-paths. */
  routes: readonly string[];
  /** Patterns inside `routes` that belong to a different app. */
  routesExcluded?: readonly string[];
  /** The app's main page, for links. */
  navPath: string;
  /**
   * Apps this one cannot run without. While a required app is off, this one
   * is effectively off too, and the required app's switch is locked.
   */
  requires?: readonly BuiltInAppId[];
  /** Every app ships on, so existing users see no change. */
  defaultEnabled: true;
}

export const BUILT_IN_APPS: readonly BuiltInApp[] = [
  {
    id: "tower",
    nameKey: I18nKey.FEED$TITLE,
    descriptionKey: I18nKey.BUILT_IN_APPS$TOWER_DESCRIPTION,
    routes: ["/feed"],
    navPath: "/feed",
    defaultEnabled: true,
  },
  {
    id: "factory",
    nameKey: I18nKey.NAV$FACTORY,
    descriptionKey: I18nKey.BUILT_IN_APPS$FACTORY_DESCRIPTION,
    // A factory's pages open automation pages (detail, setup), so Factory
    // requires Automations rather than quietly linking to a turned-off page.
    routes: ["/factory", "/automations/factories"],
    navPath: "/factory",
    requires: ["automations"],
    defaultEnabled: true,
  },
  {
    id: "automations",
    nameKey: I18nKey.BUILT_IN_APPS$AUTOMATIONS_NAME,
    descriptionKey: I18nKey.BUILT_IN_APPS$AUTOMATIONS_DESCRIPTION,
    routes: ["/automations"],
    routesExcluded: ["/automations/factories"],
    navPath: "/automations",
    defaultEnabled: true,
  },
  {
    id: "commons",
    nameKey: I18nKey.TEAM_CHAT$NAV_LABEL,
    descriptionKey: I18nKey.BUILT_IN_APPS$COMMONS_DESCRIPTION,
    routes: ["/team-chat"],
    navPath: "/team-chat",
    defaultEnabled: true,
  },
];

export function getBuiltInApp(id: BuiltInAppId): BuiltInApp {
  const app = BUILT_IN_APPS.find((candidate) => candidate.id === id);
  if (!app) throw new Error(`Unknown built-in app: ${id}`);
  return app;
}

const matches = (patterns: readonly string[] | undefined, pathname: string) =>
  (patterns ?? []).some((path) => matchPath({ path, end: false }, pathname));

/** The built-in app that owns `pathname`, or null for core and unknown routes. */
export function findBuiltInAppForPath(pathname: string): BuiltInApp | null {
  return (
    BUILT_IN_APPS.find(
      (app) =>
        matches(app.routes, pathname) && !matches(app.routesExcluded, pathname),
    ) ?? null
  );
}

/** Apps that list `id` in `requires`. */
export function getDependents(id: BuiltInAppId): BuiltInApp[] {
  return BUILT_IN_APPS.filter((app) => app.requires?.includes(id));
}
