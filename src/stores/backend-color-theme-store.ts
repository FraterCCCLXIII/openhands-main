import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { COLOR_THEMES } from "#/themes/color-theme/definitions";
import type { ColorThemeKey } from "#/themes/color-theme/types";
import {
  applyColorTheme,
  readPersistedColorTheme,
} from "#/themes/color-theme/runtime";

interface BackendColorThemeState {
  /** Color theme chosen for each backend; absent means the global default. */
  themeByBackendId: Record<string, ColorThemeKey>;
  setThemeForBackend: (backendId: string, key: ColorThemeKey) => void;
}

/** The single owner of per-backend ("workspace") color themes. */
export const useBackendColorThemeStore = create<BackendColorThemeState>()(
  persist(
    (set) => ({
      themeByBackendId: {},
      setThemeForBackend: (backendId, key) =>
        set((state) => ({
          themeByBackendId: { ...state.themeByBackendId, [backendId]: key },
        })),
    }),
    {
      name: "backend-color-themes",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ themeByBackendId: state.themeByBackendId }),
    },
  ),
);

/**
 * Applies the backend's own theme, or the global default when it has none.
 * Uses `applyColorTheme` so switching backends does not overwrite the global
 * default stored in local storage.
 */
export function applyThemeForBackend(backendId: string) {
  const mapped =
    useBackendColorThemeStore.getState().themeByBackendId[backendId];
  applyColorTheme(
    mapped && Object.hasOwn(COLOR_THEMES, mapped)
      ? mapped
      : readPersistedColorTheme(),
  );
}
