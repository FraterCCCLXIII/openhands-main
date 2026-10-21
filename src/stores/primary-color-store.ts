import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { subscribeColorTheme } from "#/themes/color-theme/runtime";

/** The preset primary colors offered in the palette popover. */
export const PRIMARY_COLOR_PRESETS = [
  { key: "blue", hex: "#3B82F6", swatch: "#3B82F6" },
  { key: "violet", hex: "#8B5CF6", swatch: "#8B5CF6" },
  { key: "pink", hex: "#EC4899", swatch: "#EC4899" },
  { key: "red", hex: "#EF4444", swatch: "#EF4444" },
  { key: "orange", hex: "#F97316", swatch: "#F97316" },
  { key: "green", hex: "#22C55E", swatch: "#22C55E" },
  { key: "teal", hex: "#14B8A6", swatch: "#14B8A6" },
  // Neutral override; the swatch is split white and black.
  {
    key: "monochrome",
    hex: "#6B7280",
    swatch: "linear-gradient(90deg, #FFFFFF 50%, #000000 50%)",
  },
] as const;

export type PrimaryColorKey = (typeof PRIMARY_COLOR_PRESETS)[number]["key"];

const STYLE_TAG_ID = "oh-primary-color-override";

/**
 * Override the brand tokens with the chosen preset, or drop the override so the
 * active color theme's own primary shows through. The doubled attribute
 * selector matches the theme runtime's specificity.
 */
function applyPrimaryColor(key: PrimaryColorKey | null) {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(STYLE_TAG_ID);
  const hex = PRIMARY_COLOR_PRESETS.find((preset) => preset.key === key)?.hex;
  if (!hex) {
    existing?.remove();
    return;
  }
  const style = existing ?? document.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = `[data-agent-server-ui][data-agent-server-ui] {\n  --oh-color-primary: ${hex};\n  --oh-accent: ${hex};\n}`;
  // Re-append so the override stays after the theme sheet in document order.
  document.head.appendChild(style);
}

interface PrimaryColorState {
  /** `null` means no override: the active color theme's primary applies. */
  primaryColorKey: PrimaryColorKey | null;
  setPrimaryColorKey: (key: PrimaryColorKey | null) => void;
}

/** The single owner of the app-wide primary color override. */
export const usePrimaryColorStore = create<PrimaryColorState>()(
  persist(
    (set) => ({
      primaryColorKey: null,
      setPrimaryColorKey: (key) => {
        applyPrimaryColor(key);
        set({ primaryColorKey: key });
      },
    }),
    {
      name: "primary-color",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ primaryColorKey: state.primaryColorKey }),
      onRehydrateStorage: () => (state) => {
        if (state) applyPrimaryColor(state.primaryColorKey);
      },
    },
  ),
);

// Applying a color theme replaces its own override sheet, which would drop
// the primary color, so re-apply after every theme change.
subscribeColorTheme(() =>
  applyPrimaryColor(usePrimaryColorStore.getState().primaryColorKey),
);
