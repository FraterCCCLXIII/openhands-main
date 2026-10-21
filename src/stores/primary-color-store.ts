import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { subscribeColorTheme } from "#/themes/color-theme/runtime";

interface PrimaryColorPreset {
  key: string;
  /** CSS background of the swatch in the palette popover. */
  swatch: string;
  /** Value for --oh-color-primary (main buttons) and --oh-accent. */
  primary: string;
  /** Value for --oh-accent-foreground when it must differ from the theme's. */
  accentForeground?: string;
}

/** The preset primary colors offered in the palette popover. */
export const PRIMARY_COLOR_PRESETS = [
  { key: "blue", swatch: "#3B82F6", primary: "#3B82F6" },
  { key: "violet", swatch: "#8B5CF6", primary: "#8B5CF6" },
  { key: "pink", swatch: "#EC4899", primary: "#EC4899" },
  { key: "red", swatch: "#EF4444", primary: "#EF4444" },
  { key: "orange", swatch: "#F97316", primary: "#F97316" },
  { key: "green", swatch: "#22C55E", primary: "#22C55E" },
  { key: "teal", swatch: "#14B8A6", primary: "#14B8A6" },
  // Black buttons in light themes and white buttons in dark ones, with text in the opposite color.
  {
    key: "monochrome",
    swatch: "conic-gradient(#FFFFFF 0 50%, #000000 50% 100%)",
    primary: "light-dark(#000000, #FFFFFF)",
    accentForeground: "light-dark(#FFFFFF, #000000)",
  },
] as const satisfies readonly PrimaryColorPreset[];

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
  const preset: PrimaryColorPreset | undefined = PRIMARY_COLOR_PRESETS.find(
    (item) => item.key === key,
  );
  if (!preset) {
    existing?.remove();
    return;
  }
  const declarations = [
    `  --oh-color-primary: ${preset.primary};`,
    `  --oh-accent: ${preset.primary};`,
    ...(preset.accentForeground
      ? [`  --oh-accent-foreground: ${preset.accentForeground};`]
      : []),
  ];
  const style = existing ?? document.createElement("style");
  style.id = STYLE_TAG_ID;
  style.textContent = `[data-agent-server-ui][data-agent-server-ui] {\n${declarations.join("\n")}\n}`;
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
