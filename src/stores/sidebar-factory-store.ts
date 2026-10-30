import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SidebarFactoryState {
  /** The factory whose conversations the left nav list shows, or null for all of them. */
  factoryId: string | null;
  /** How many factories the list shows before the rest hide behind the grip. */
  visibleRows: number;
}

interface SidebarFactoryActions {
  selectFactory: (factoryId: string | null) => void;
  setVisibleRows: (rows: number) => void;
}

/**
 * Owns the left nav's factory filter. The factory list writes it and the conversation list below
 * reads it, so choosing a factory narrows the conversations to that factory's agents.
 */
export const useSidebarFactoryStore = create<
  SidebarFactoryState & SidebarFactoryActions
>()(
  persist(
    (set) => ({
      factoryId: null,
      visibleRows: 4,
      selectFactory: (factoryId) => set({ factoryId }),
      setVisibleRows: (rows) =>
        set({ visibleRows: Math.max(1, Math.round(rows)) }),
    }),
    {
      name: "sidebar-factory-filter",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
