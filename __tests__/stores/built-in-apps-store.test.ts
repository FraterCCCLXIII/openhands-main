import { beforeEach, describe, expect, it } from "vitest";
import { findBuiltInAppForPath } from "#/built-in-apps/registry";
import {
  BUILT_IN_APPS_STORAGE_KEY,
  isBuiltInAppEnabled,
  useBuiltInAppsStore,
} from "#/stores/built-in-apps-store";

const enabled = (
  backendId: string,
  id: Parameters<typeof isBuiltInAppEnabled>[2],
) =>
  isBuiltInAppEnabled(useBuiltInAppsStore.getState().byBackend, backendId, id);

describe("built-in apps store", () => {
  beforeEach(() => {
    localStorage.clear();
    useBuiltInAppsStore.setState({ byBackend: {} });
  });

  it("has every app on by default so existing users see no change", () => {
    (["tower", "factory", "automations", "commons"] as const).forEach((id) => {
      expect(enabled("any-backend", id)).toBe(true);
    });
  });

  it("scopes a choice to the backend it was made on", () => {
    useBuiltInAppsStore.getState().setEnabled("a", "tower", false);

    expect(enabled("a", "tower")).toBe(false);
    expect(enabled("b", "tower")).toBe(true);
  });

  it("persists choices under a stable, versioned key and restores them", async () => {
    useBuiltInAppsStore.getState().setEnabled("a", "commons", false);

    const raw = localStorage.getItem(BUILT_IN_APPS_STORAGE_KEY) ?? "null";
    expect(JSON.parse(raw).version).toBe(1);

    // Simulate a fresh page load: empty memory, saved data still on disk.
    useBuiltInAppsStore.setState({ byBackend: {} });
    localStorage.setItem(BUILT_IN_APPS_STORAGE_KEY, raw);
    await useBuiltInAppsStore.persist.rehydrate();

    expect(enabled("a", "commons")).toBe(false);
  });

  it("migrates older stored data, dropping unknown apps and bad values", async () => {
    localStorage.setItem(
      BUILT_IN_APPS_STORAGE_KEY,
      JSON.stringify({
        version: 0,
        state: {
          byBackend: {
            a: { tower: false, retired: false, factory: "no" },
            b: "garbage",
          },
        },
      }),
    );

    await useBuiltInAppsStore.persist.rehydrate();

    expect(enabled("a", "tower")).toBe(false);
    expect(enabled("a", "factory")).toBe(true);
    expect(useBuiltInAppsStore.getState().byBackend).toEqual({
      a: { tower: false },
    });
  });

  describe("dependencies", () => {
    it("keeps Automations on while Factory needs it", () => {
      const { setEnabled } = useBuiltInAppsStore.getState();

      expect(setEnabled("a", "automations", false)).toBe(false);
      expect(enabled("a", "automations")).toBe(true);

      setEnabled("a", "factory", false);
      expect(setEnabled("a", "automations", false)).toBe(true);
      expect(enabled("a", "automations")).toBe(false);
    });

    it("treats Factory as off whenever Automations is off, without changing its own switch", () => {
      useBuiltInAppsStore.setState({
        byBackend: { a: { automations: false } },
      });

      expect(enabled("a", "factory")).toBe(false);
      expect(
        useBuiltInAppsStore.getState().byBackend.a.factory,
      ).toBeUndefined();
    });
  });

  describe("route ownership", () => {
    it.each([
      ["/feed", "tower"],
      ["/feed/people/ada", "tower"],
      ["/factory", "factory"],
      ["/automations/factories/f1/settings", "factory"],
      ["/automations", "automations"],
      ["/automations/setup", "automations"],
      ["/team-chat", "commons"],
    ])("assigns %s to %s", (pathname, id) => {
      expect(findBuiltInAppForPath(pathname)?.id).toBe(id);
    });

    it.each([
      "/",
      "/conversations",
      "/settings/app",
      "/apps",
      "/automations-x",
    ])("leaves core route %s unowned", (pathname) => {
      expect(findBuiltInAppForPath(pathname)).toBeNull();
    });
  });
});
