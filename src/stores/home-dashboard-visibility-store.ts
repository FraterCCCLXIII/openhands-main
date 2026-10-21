import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Home dashboard sections that can be hidden from the HUD. */
export const HOME_DASHBOARD_COMPONENT_IDS = [
  "learnResources",
  "recommendedAutomations",
  "pinnedAutomations",
  "runningAutomations",
] as const;

export type HomeDashboardComponentId =
  (typeof HOME_DASHBOARD_COMPONENT_IDS)[number];

/**
 * Every section appears in the reorder list. Learn resources stays in the
 * header above the composer, so its position only sets its place in the list.
 */
export const HOME_DASHBOARD_REORDERABLE_IDS = [
  "learnResources",
  "recommendedAutomations",
  "pinnedAutomations",
  "runningAutomations",
] as const;

export type HomeDashboardReorderableId =
  (typeof HOME_DASHBOARD_REORDERABLE_IDS)[number];

const DEFAULT_ORDER: HomeDashboardReorderableId[] = [
  ...HOME_DASHBOARD_REORDERABLE_IDS,
];

/**
 * Keeps only known ids, drops duplicates, and appends any missing ids in
 * default order, so stale or partial persisted data still yields a full order.
 */
function normalizeOrder(order: unknown): HomeDashboardReorderableId[] {
  const known = new Set<string>(HOME_DASHBOARD_REORDERABLE_IDS);
  const seen = new Set<HomeDashboardReorderableId>();
  const next: HomeDashboardReorderableId[] = [];
  if (Array.isArray(order)) {
    for (const id of order) {
      if (typeof id !== "string" || !known.has(id)) continue;
      const reorderable = id as HomeDashboardReorderableId;
      if (seen.has(reorderable)) continue;
      seen.add(reorderable);
      next.push(reorderable);
    }
  }
  for (const id of DEFAULT_ORDER) {
    if (!seen.has(id)) next.push(id);
  }
  return next;
}

interface HomeDashboardVisibilityState {
  /** Only hidden ids are stored; anything absent is visible. */
  hiddenIds: Partial<Record<HomeDashboardComponentId, true>>;
  /** Always a full, valid ordering of the reorderable sections. */
  order: HomeDashboardReorderableId[];
  setHidden: (id: HomeDashboardComponentId, hidden: boolean) => void;
  /** Moves a reorderable section to `index` in the order. */
  moveTo: (id: HomeDashboardReorderableId, index: number) => void;
}

/**
 * The single owner of how the home dashboard is shown: which sections are
 * visible and their order. Writers are the hover X on each section and the
 * components menu; both go through this store's actions.
 */
export const useHomeDashboardVisibilityStore =
  create<HomeDashboardVisibilityState>()(
    persist(
      (set) => ({
        hiddenIds: {},
        order: DEFAULT_ORDER,
        setHidden: (id, hidden) =>
          set((state) => {
            const next = { ...state.hiddenIds };
            if (hidden) next[id] = true;
            else delete next[id];
            return { hiddenIds: next };
          }),
        moveTo: (id, index) =>
          set((state) => {
            const rest = state.order.filter((item) => item !== id);
            rest.splice(index, 0, id);
            return { order: rest };
          }),
      }),
      {
        name: "home-dashboard-visibility",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          hiddenIds: state.hiddenIds,
          order: state.order,
        }),
        merge: (persisted, current) => {
          const saved = persisted as Partial<HomeDashboardVisibilityState>;
          return {
            ...current,
            hiddenIds: saved.hiddenIds ?? current.hiddenIds,
            order: normalizeOrder(saved.order),
          };
        },
      },
    ),
  );
