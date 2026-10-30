import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_KAMIJI_HAND_LOOK,
  sanitizeKamijiHandLook,
  type KamijiHandLook,
} from "#/components/features/kamiji/kamiji-hand-look";

export const KAMIJI_HAND_STORAGE_KEY = "kamiji-hand";
const KAMIJI_HAND_STORE_VERSION = 1;

interface KamijiHandState {
  look: KamijiHandLook;
  /** Merges a partial change into the look; invalid values fall back to the default. */
  updateLook: (patch: Partial<KamijiHandLook>) => void;
  /** Back to the default Hand. */
  resetLook: () => void;
}

interface PersistedKamijiHand {
  look?: unknown;
}

/**
 * The single owner of the user's Hand avatar customisation. The Hand editor
 * is its only writer; every Hand avatar reads it through `useKamijiHandLook`.
 */
export const useKamijiHandStore = create<KamijiHandState>()(
  persist(
    (set) => ({
      look: DEFAULT_KAMIJI_HAND_LOOK,
      updateLook: (patch) =>
        set((state) => ({
          look: sanitizeKamijiHandLook({ ...state.look, ...patch }),
        })),
      resetLook: () => set({ look: DEFAULT_KAMIJI_HAND_LOOK }),
    }),
    {
      name: KAMIJI_HAND_STORAGE_KEY,
      version: KAMIJI_HAND_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ look: state.look }),
      // Version 0 kept the look fields at the top level of the stored object.
      migrate: (persisted) => {
        const stored = (persisted ?? {}) as PersistedKamijiHand;
        return { look: sanitizeKamijiHandLook(stored.look ?? persisted) };
      },
      merge: (persisted, current) => ({
        ...current,
        look: sanitizeKamijiHandLook((persisted as PersistedKamijiHand)?.look),
      }),
    },
  ),
);

export function useKamijiHandLook(): KamijiHandLook {
  return useKamijiHandStore((state) => state.look);
}
