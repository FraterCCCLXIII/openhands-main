import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface TurnDetailsState {
  /** Show the rest of the conversation's model usage beside each call's numbers. */
  showConversationTotals: boolean;
  setShowConversationTotals: (value: boolean) => void;
}

/** Owns the Details panel preference. The writer is `setShowConversationTotals`. */
export const useTurnDetailsStore = create<TurnDetailsState>()(
  persist(
    (set) => ({
      showConversationTotals: false,
      setShowConversationTotals: (value) =>
        set({ showConversationTotals: value }),
    }),
    {
      name: "turn-details",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
