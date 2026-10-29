import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** A factory someone created, saved beside the built-in simulated ones. */
export interface CustomFactory {
  id: string;
  name: string;
  description: string;
  /** Id of the simulated teammate who owns it. */
  ownerId: string;
}

interface FeedFactoriesState {
  custom: CustomFactory[];
}

interface FeedFactoriesActions {
  addFactory: (factory: CustomFactory) => void;
}

/** Owns the factories people add; every factory list reads from here. */
export const useFeedFactoriesStore = create<
  FeedFactoriesState & FeedFactoriesActions
>()(
  persist(
    (set) => ({
      custom: [],
      addFactory: (factory) =>
        set((state) => ({ custom: [...state.custom, factory] })),
    }),
    {
      name: "feed-factories",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
