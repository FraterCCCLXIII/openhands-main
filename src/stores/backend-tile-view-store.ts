import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface BackendTileViewState {
  enabled: boolean;
  toggle: () => void;
}

/**
 * The single owner of the left rail preference. The backend
 * dropdown footer is the only writer; it is stored per viewer in localStorage.
 */
export const useBackendTileViewStore = create<BackendTileViewState>()(
  persist(
    (set) => ({
      enabled: false,
      toggle: () => set((state) => ({ enabled: !state.enabled })),
    }),
    {
      name: "backend-tile-view",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ enabled: state.enabled }),
    },
  ),
);
