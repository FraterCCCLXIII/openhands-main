import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface DismissedUpdateState {
  /** The version whose "new version" tile was closed; a newer one shows again. */
  version: string | null;
  dismiss: (version: string) => void;
}

/** Owns which update notice was closed; the writer is `dismiss`. */
export const useDismissedUpdateStore = create<DismissedUpdateState>()(
  persist(
    (set) => ({
      version: null,
      dismiss: (version) => set({ version }),
    }),
    {
      name: "dismissed-update",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
