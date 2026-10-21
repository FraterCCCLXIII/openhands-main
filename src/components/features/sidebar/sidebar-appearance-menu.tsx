import React from "react";
import { useTranslation } from "react-i18next";
import { Palette } from "lucide-react";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { I18nKey } from "#/i18n/declaration";
import { ToggleSwitch } from "#/ui/toggle-switch";
import { DEFAULT_COLOR_THEME } from "#/themes/color-theme/definitions";
import type { ColorThemeKey } from "#/themes/color-theme/types";
import {
  readPersistedColorTheme,
  setColorTheme,
} from "#/themes/color-theme/runtime";
import {
  TEXT_SIZE_MAX_PERCENT,
  TEXT_SIZE_MIN_PERCENT,
  useTextSizeStore,
} from "#/stores/text-size-store";
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
};

const LIGHT_THEME: ColorThemeKey = "light-plus";
const LIGHT_THEME_KEYS: readonly ColorThemeKey[] = [
  "light-plus",
  "solarized-light",
];

/** Palette button that opens a popover with a light theme toggle and a text size slider. */
export function SidebarAppearanceMenu() {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);
  const [isLight, setIsLight] = React.useState(() =>
    LIGHT_THEME_KEYS.includes(readPersistedColorTheme()),
  );
  const anchorRef = React.useRef<HTMLButtonElement>(null);
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

  const toggleLight = () => {
    const next = !isLight;
    setColorTheme(next ? LIGHT_THEME : DEFAULT_COLOR_THEME);
    setIsLight(next);
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
      {open ? (
        <div
          ref={menuRef}
          data-testid="sidebar-appearance-menu"
          className="absolute right-0 bottom-full z-50 mb-1 flex w-64 flex-col gap-3 rounded-xl border border-border-subtle bg-tertiary p-3 shadow-lg"
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
                      "size-6 cursor-pointer rounded-full border-2 transition-transform hover:scale-110",
                      isSelected ? "border-contrast" : "border-transparent",
                    )}
                    style={{ backgroundColor: preset.hex }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
