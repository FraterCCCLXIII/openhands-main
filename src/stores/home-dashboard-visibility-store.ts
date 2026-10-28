import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  HOME_DASHBOARD_WIDGETS,
  type HomeDashboardWidgetId,
} from "#/components/features/home/home-dashboard-widgets";

/** Home dashboard widgets, derived from the widget registry. */
export const HOME_DASHBOARD_COMPONENT_IDS = HOME_DASHBOARD_WIDGETS.map(
  (widget) => widget.id,
) as HomeDashboardWidgetId[];

export type HomeDashboardComponentId = HomeDashboardWidgetId;

/**
 * Every widget appears in the reorder list. Header-placed widgets (Learn
 * resources) render above the composer, so their position only sets their
 * place in the list.
 */
export const HOME_DASHBOARD_REORDERABLE_IDS = HOME_DASHBOARD_COMPONENT_IDS;

export type HomeDashboardReorderableId = HomeDashboardComponentId;

const DEFAULT_VISIBLE = new Map<string, boolean>(
  HOME_DASHBOARD_WIDGETS.map((widget) => [widget.id, widget.defaultVisible]),
);

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
  /** Default-on widgets the user hid; anything absent keeps its default. */
  hiddenIds: Partial<Record<HomeDashboardComponentId, true>>;
  /** Default-off widgets the user turned on. */
  shownIds: Partial<Record<HomeDashboardComponentId, true>>;
  /** Always a full, valid ordering of the reorderable sections. */
  order: HomeDashboardReorderableId[];
  setHidden: (id: HomeDashboardComponentId, hidden: boolean) => void;
  /** Moves a reorderable section to `index` in the order. */
  moveTo: (id: HomeDashboardReorderableId, index: number) => void;
}

/** Whether a widget is currently hidden, honoring its registry default. */
export function isHomeDashboardComponentHidden(
  state: Pick<HomeDashboardVisibilityState, "hiddenIds" | "shownIds">,
  id: HomeDashboardComponentId,
): boolean {
  return DEFAULT_VISIBLE.get(id) === false
    ? !state.shownIds[id]
    : Boolean(state.hiddenIds[id]);
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
        shownIds: {},
        order: DEFAULT_ORDER,
        setHidden: (id, hidden) =>
          set((state) => {
            if (DEFAULT_VISIBLE.get(id) === false) {
              const shown = { ...state.shownIds };
              if (hidden) delete shown[id];
              else shown[id] = true;
              return { shownIds: shown };
            }
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
          shownIds: state.shownIds,
          order: state.order,
        }),
        merge: (persisted, current) => {
          const saved = persisted as Partial<HomeDashboardVisibilityState>;
          return {
            ...current,
            hiddenIds: saved.hiddenIds ?? current.hiddenIds,
            shownIds: saved.shownIds ?? current.shownIds,
            order: normalizeOrder(saved.order),
          };
        },
      },
    ),
  );
