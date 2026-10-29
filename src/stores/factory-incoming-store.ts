import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FactoryIncomingState {
  /** Ids of the incoming items already routed into a factory. */
  routed: string[];
}

interface FactoryIncomingActions {
  markRouted: (id: string) => void;
}

/** Owns which incoming items have been routed. The writer is `markRouted`. */
export const useFactoryIncomingStore = create<
  FactoryIncomingState & FactoryIncomingActions
>()(
  persist(
    (set) => ({
      routed: [],
      markRouted: (id) =>
        set((state) =>
          state.routed.includes(id) ? state : { routed: [...state.routed, id] },
        ),
    }),
    {
      name: "factory-incoming",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
