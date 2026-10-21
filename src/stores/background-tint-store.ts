import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const BACKGROUND_TINT_DEFAULT_PERCENT = 0;
export const BACKGROUND_TINT_MIN_PERCENT = 0;
export const BACKGROUND_TINT_MAX_PERCENT = 100;
/** Overlay opacity at 100%: enough to read as a tint without washing out text. */
const BACKGROUND_TINT_MAX_OPACITY = 0.25;

/** Publishes the tint strength read by BackgroundTintOverlay. */
function applyBackgroundTint(percent: number) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty(
    "--oh-bg-tint",
    String(
      (percent / BACKGROUND_TINT_MAX_PERCENT) * BACKGROUND_TINT_MAX_OPACITY,
    ),
  );
}

interface BackgroundTintState {
  /** Strength of the accent-colored background tint, 0 for none. */
  percent: number;
  setPercent: (percent: number) => void;
}

/** The single owner of the background tint strength. */
export const useBackgroundTintStore = create<BackgroundTintState>()(
  persist(
    (set) => ({
      percent: BACKGROUND_TINT_DEFAULT_PERCENT,
      setPercent: (percent) => {
        applyBackgroundTint(percent);
        set({ percent });
      },
    }),
    {
      name: "background-tint",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ percent: state.percent }),
      onRehydrateStorage: () => (state) => {
        if (state) applyBackgroundTint(state.percent);
      },
    },
  ),
);
