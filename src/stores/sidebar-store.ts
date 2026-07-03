"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SidebarState {
  collapsed: boolean;
}

interface SidebarActions {
  setCollapsed: (next: boolean | ((prev: boolean) => boolean)) => void;
  toggleCollapsed: () => void;
}

type SidebarStore = SidebarState & SidebarActions;

const STORAGE_KEY = "integrations-hub-sidebar";

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,
      setCollapsed: (next) =>
        set((state) => ({
          collapsed: typeof next === "function" ? next(state.collapsed) : next,
        })),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): SidebarState => ({ collapsed: state.collapsed }),
    },
  ),
);
