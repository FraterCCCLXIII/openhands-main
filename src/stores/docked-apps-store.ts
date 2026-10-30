import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface DockedAppsState {
  /** Apps taken off the left nav, by extension name. Absent means docked. */
  undocked: Record<string, true>;
  setDocked: (name: string, docked: boolean) => void;
}

/** Owns which installed apps show in the left nav; the writer is `setDocked`. */
export const useDockedAppsStore = create<DockedAppsState>()(
  persist(
    (set) => ({
      undocked: {},
      setDocked: (name, docked) =>
        set((state) => {
          const { [name]: _removed, ...rest } = state.undocked;
          return { undocked: docked ? rest : { ...rest, [name]: true } };
        }),
    }),
    { name: "docked-apps", storage: createJSONStorage(() => localStorage) },
  ),
);
