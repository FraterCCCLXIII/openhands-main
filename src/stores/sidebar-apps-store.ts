import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SidebarAppsState {
  /** How many apps show in the left nav before the rest hide behind the grip. */
  visibleCount: number;
  setVisibleCount: (count: number) => void;
  /** The order people dragged their apps into, as nav keys; apps not listed follow in default order. */
  order: string[];
  /** Moves `key` to sit before `beforeKey` (or last when null), within the keys shown. */
  moveApp: (key: string, beforeKey: string | null, shown: string[]) => void;
}

/** Owns the left nav's apps list open/closed state; the writer is `setExpanded`. */
export const useSidebarAppsStore = create<SidebarAppsState>()(
  persist(
    (set) => ({
      visibleCount: 5,
      setVisibleCount: (count) =>
        set({ visibleCount: Math.max(1, Math.round(count)) }),
      order: [],
      moveApp: (key, beforeKey, shown) =>
        set(() => {
          const next = shown.filter((k) => k !== key);
          const at = beforeKey === null ? next.length : next.indexOf(beforeKey);
          next.splice(at < 0 ? next.length : at, 0, key);
          return { order: next };
        }),
    }),
    { name: "sidebar-apps", storage: createJSONStorage(() => localStorage) },
  ),
);
