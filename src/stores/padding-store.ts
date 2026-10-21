import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const PADDING_DEFAULT_PERCENT = 100;
export const PADDING_MIN_PERCENT = 0;
export const PADDING_MAX_PERCENT = 200;

/** Publishes the scale that layout padding and gaps multiply their base by. */
function applyPadding(percent: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(
    "--oh-padding-scale",
    String(percent / 100),
  );
}

interface PaddingState {
  /** Layout padding as a percentage of the default spacing. */
  percent: number;
  setPercent: (percent: number) => void;
}

/** The single owner of the app-wide layout padding scale. */
export const usePaddingStore = create<PaddingState>()(
  persist(
    (set) => ({
      percent: PADDING_DEFAULT_PERCENT,
      setPercent: (percent) => {
        applyPadding(percent);
        set({ percent });
      },
    }),
    {
      name: "layout-padding",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ percent: state.percent }),
      onRehydrateStorage: () => (state) => {
        if (state) applyPadding(state.percent);
      },
    },
  ),
);
