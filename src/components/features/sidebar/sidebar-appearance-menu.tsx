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
        </div>
      ) : null}
    </div>
  );
}
