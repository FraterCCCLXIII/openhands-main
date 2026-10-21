import React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Palette } from "lucide-react";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { I18nKey } from "#/i18n/declaration";
import { ToggleSwitch } from "#/ui/toggle-switch";
import {
  AVAILABLE_COLOR_THEMES,
  DEFAULT_COLOR_THEME,
} from "#/themes/color-theme/definitions";
import type { ColorThemeKey } from "#/themes/color-theme/types";
import {
  readPersistedColorTheme,
  applyColorTheme,
} from "#/themes/color-theme/runtime";
import {
  TEXT_SIZE_MAX_PERCENT,
  TEXT_SIZE_MIN_PERCENT,
  useTextSizeStore,
} from "#/stores/text-size-store";
import { useBackendColorThemeStore } from "#/stores/backend-color-theme-store";
import {
  PRIMARY_COLOR_PRESETS,
  usePrimaryColorStore,
  type PrimaryColorKey,
} from "#/stores/primary-color-store";
import { cn } from "#/utils/utils";

const PRIMARY_COLOR_NAME_KEYS: Record<PrimaryColorKey, I18nKey> = {
  blue: I18nKey.COLOR$BLUE,
  violet: I18nKey.COLOR$VIOLET,
  pink: I18nKey.COLOR$PINK,
  red: I18nKey.COLOR$RED,
  orange: I18nKey.COLOR$ORANGE,
  green: I18nKey.COLOR$GREEN,
  teal: I18nKey.COLOR$TEAL,
  monochrome: I18nKey.COLOR$MONOCHROME,
};

const POPOVER_WIDTH_PX = 288;
const LIGHT_THEME: ColorThemeKey = "light-plus";
const LIGHT_THEME_KEYS: readonly ColorThemeKey[] = [
  "light-plus",
  "solarized-light",
];

/** Palette button that opens a popover with a light theme toggle and a text size slider. */
export function SidebarAppearanceMenu({
  backendId,
}: {
  /** The connected backend whose theme the selector edits. */
  backendId: string;
}) {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);
  const mappedTheme = useBackendColorThemeStore(
    (state) => state.themeByBackendId[backendId],
  );
  const colorTheme: ColorThemeKey = mappedTheme ?? readPersistedColorTheme();
  const themeSelectId = React.useId();
  const isLight = LIGHT_THEME_KEYS.includes(colorTheme);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  // Fixed positioning keeps the popover inside the viewport even when the
  // footer button sits far from the sidebar edge.
  const anchorRect = open ? anchorRef.current?.getBoundingClientRect() : null;
  const menuStyle: React.CSSProperties | undefined = anchorRect
    ? {
        left: Math.min(
          Math.max(8, anchorRect.left),
          window.innerWidth - POPOVER_WIDTH_PX - 8,
        ),
        bottom: window.innerHeight - anchorRect.top + 4,
      }
    : undefined;
  const menuRef = useClickOutsideElement<HTMLDivElement>(
    () => setOpen(false),
    anchorRef,
  );
  const textSizePercent = useTextSizeStore((state) => state.percent);
  const setTextSizePercent = useTextSizeStore((state) => state.setPercent);
  const primaryColorKey = usePrimaryColorStore(
    (state) => state.primaryColorKey,
  );
  const setPrimaryColorKey = usePrimaryColorStore(
    (state) => state.setPrimaryColorKey,
  );

  const selectTheme = (key: ColorThemeKey) => {
    useBackendColorThemeStore.getState().setThemeForBackend(backendId, key);
    applyColorTheme(key);
  };

  const toggleLight = () => {
    selectTheme(isLight ? DEFAULT_COLOR_THEME : LIGHT_THEME);
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={anchorRef}
        type="button"
        data-testid="sidebar-appearance-trigger"
        aria-label={t(I18nKey.SIDEBAR$APPEARANCE)}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface-raised hover:text-contrast"
      >
        <Palette aria-hidden className="size-4" />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              data-testid="sidebar-appearance-menu"
              style={menuStyle}
              className="fixed z-50 flex w-72 flex-col gap-3 rounded-xl border border-border-subtle bg-tertiary p-3 shadow-lg"
            >
              <div className="flex items-center justify-between gap-2 text-sm text-contrast">
                <span>{t(I18nKey.SIDEBAR$LIGHT_THEME)}</span>
                <ToggleSwitch
                  enabled={isLight}
                  label={t(I18nKey.SIDEBAR$LIGHT_THEME)}
                  onToggle={toggleLight}
                />
              </div>
              <div className="flex flex-col gap-2 text-sm text-contrast">
                <label htmlFor={themeSelectId}>
                  {t(I18nKey.SETTINGS$COLOR_THEME)}
                </label>
                <select
                  id={themeSelectId}
                  data-testid="sidebar-color-theme-select"
                  value={colorTheme}
                  onChange={(event) =>
                    selectTheme(event.currentTarget.value as ColorThemeKey)
                  }
                  className="h-8 w-full rounded-md bg-surface-raised px-2 text-sm text-contrast"
                >
                  {AVAILABLE_COLOR_THEMES.map((theme) => (
                    <option key={theme.key} value={theme.key}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 text-sm text-contrast">
                <span className="flex items-center justify-between">
                  <span>{t(I18nKey.SIDEBAR$TEXT_SIZE)}</span>
                  <span className="text-muted">{textSizePercent}%</span>
                </span>
                <input
                  type="range"
                  aria-label={t(I18nKey.SIDEBAR$TEXT_SIZE)}
                  data-testid="sidebar-text-size-slider"
                  min={TEXT_SIZE_MIN_PERCENT}
                  max={TEXT_SIZE_MAX_PERCENT}
                  step={5}
                  value={textSizePercent}
                  onChange={(event) =>
                    setTextSizePercent(Number(event.currentTarget.value))
                  }
                  className="w-full cursor-pointer accent-contrast"
                />
              </div>
              <div className="flex flex-col gap-2 text-sm text-contrast">
                <span>{t(I18nKey.SIDEBAR$PRIMARY_COLOR)}</span>
                <div role="radiogroup" className="flex flex-wrap gap-2">
                  {PRIMARY_COLOR_PRESETS.map((preset) => {
                    const isSelected = primaryColorKey === preset.key;
                    const colorName = t(PRIMARY_COLOR_NAME_KEYS[preset.key]);
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={colorName}
                        title={colorName}
                        data-testid={`sidebar-primary-color-${preset.key}`}
                        onClick={() =>
                          // Clicking the selected swatch clears the override.
                          setPrimaryColorKey(isSelected ? null : preset.key)
                        }
                        className={cn(
                          "size-6 cursor-pointer rounded-full border-2 ring-1 ring-inset ring-white/20 transition-transform hover:scale-110",
                          isSelected ? "border-contrast" : "border-transparent",
                        )}
                        style={{ background: preset.swatch }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
