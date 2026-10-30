import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { NO_BACKEND_ID } from "#/api/backend-registry/active-store";
import { useActiveBackend } from "#/contexts/active-backend-context";
import {
  BUILT_IN_APPS,
  getBuiltInApp,
  getDependents,
  type BuiltInAppId,
} from "#/built-in-apps/registry";

export const BUILT_IN_APPS_STORAGE_KEY = "built-in-apps";
const STORAGE_VERSION = 1;

type Overrides = Partial<Record<BuiltInAppId, boolean>>;
type ByBackend = Record<string, Overrides>;

interface BuiltInAppsState {
  /**
   * Only explicit choices are stored, per backend id. An absent entry means
   * the registry default (on), so a new app never needs a migration.
   */
  byBackend: ByBackend;
  /**
   * Returns false, changing nothing, when the switch is locked: turning an
   * app off while another enabled app requires it.
   */
  setEnabled: (
    backendId: string,
    id: BuiltInAppId,
    enabled: boolean,
  ) => boolean;
}

const KNOWN_IDS = new Set<string>(BUILT_IN_APPS.map((app) => app.id));

/** Keeps only well-formed `{ knownId: boolean }` entries from untrusted JSON. */
export function sanitizeByBackend(value: unknown): ByBackend {
  if (!value || typeof value !== "object") return {};
  const result: ByBackend = {};
  Object.entries(value as Record<string, unknown>).forEach(
    ([backendId, raw]) => {
      if (!raw || typeof raw !== "object") return;
      const overrides: Overrides = {};
      Object.entries(raw as Record<string, unknown>).forEach(([id, flag]) => {
        if (KNOWN_IDS.has(id) && typeof flag === "boolean") {
          overrides[id as BuiltInAppId] = flag;
        }
      });
      result[backendId] = overrides;
    },
  );
  return result;
}

/**
 * Whether `id` is effectively on: its own switch is on and every app it
 * requires is on too. This only decides visibility - it never touches the
 * feature's own data stores.
 */
export function isBuiltInAppEnabled(
  byBackend: ByBackend,
  backendId: string,
  id: BuiltInAppId,
  seen: readonly BuiltInAppId[] = [],
): boolean {
  if (seen.includes(id)) return true;
  const app = getBuiltInApp(id);
  if (!(byBackend[backendId]?.[id] ?? app.defaultEnabled)) return false;
  return (app.requires ?? []).every((required) =>
    isBuiltInAppEnabled(byBackend, backendId, required, [...seen, id]),
  );
}

/** The enabled apps that stop `id` from being turned off. */
export function getEnabledDependents(
  byBackend: ByBackend,
  backendId: string,
  id: BuiltInAppId,
): BuiltInAppId[] {
  return getDependents(id)
    .filter((app) => isBuiltInAppEnabled(byBackend, backendId, app.id))
    .map((app) => app.id);
}

// @spec CE-011 — Built-in apps share the switch model
/** Owns which built-in apps are switched on, per backend; `setEnabled` is the only writer. */
export const useBuiltInAppsStore = create<BuiltInAppsState>()(
  persist(
    (set, get) => ({
      byBackend: {},
      setEnabled: (backendId, id, enabled) => {
        const { byBackend } = get();
        if (!enabled && getEnabledDependents(byBackend, backendId, id).length) {
          return false;
        }
        set({
          byBackend: {
            ...byBackend,
            [backendId]: { ...byBackend[backendId], [id]: enabled },
          },
        });
        return true;
      },
    }),
    {
      name: BUILT_IN_APPS_STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ byBackend: state.byBackend }),
      // Future shape changes extend this; every version maps through the
      // sanitizer so unknown ids and bad values never reach the store.
      migrate: (persisted) => ({
        byBackend: sanitizeByBackend(
          (persisted as { byBackend?: unknown } | null)?.byBackend,
        ),
      }),
    },
  ),
);

/** The active backend's id, or the no-backend sentinel. */
export function useBuiltInAppsBackendId(): string {
  const { backend } = useActiveBackend();
  return backend?.id ?? NO_BACKEND_ID;
}

/** Whether a built-in app is on for the active backend. */
export function useBuiltInAppEnabled(id: BuiltInAppId): boolean {
  const backendId = useBuiltInAppsBackendId();
  return useBuiltInAppsStore((state) =>
    isBuiltInAppEnabled(state.byBackend, backendId, id),
  );
}
