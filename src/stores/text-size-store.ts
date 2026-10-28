import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const TEXT_SIZE_DEFAULT_PERCENT = 100;
export const TEXT_SIZE_MIN_PERCENT = 90;
export const TEXT_SIZE_MAX_PERCENT = 120;

/** Scales the root font size, which the rem-based UI sizes follow. */
function applyTextSize(percent: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.fontSize = `${percent}%`;
}

interface TextSizeState {
  /** Root font size as a percentage of the browser default. */
  percent: number;
  setPercent: (percent: number) => void;
}

/** The single owner of the app-wide text size. */
export const useTextSizeStore = create<TextSizeState>()(
  persist(
    (set) => ({
      percent: TEXT_SIZE_DEFAULT_PERCENT,
      setPercent: (percent) => {
        applyTextSize(percent);
        set({ percent });
      },
    }),
    {
      name: "text-size",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ percent: state.percent }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTextSize(state.percent);
      },
    },
  ),
);
