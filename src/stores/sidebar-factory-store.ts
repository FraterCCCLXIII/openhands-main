import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SidebarFactoryState {
  /** The factory whose conversations the left nav list shows, or null for all of them. */
  factoryId: string | null;
  /** Whether the factory list shows every factory or just the first few. */
  expanded: boolean;
}

interface SidebarFactoryActions {
  selectFactory: (factoryId: string | null) => void;
  setExpanded: (expanded: boolean) => void;
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
      expanded: false,
      selectFactory: (factoryId) => set({ factoryId }),
      setExpanded: (expanded) => set({ expanded }),
    }),
    {
      name: "sidebar-factory-filter",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
