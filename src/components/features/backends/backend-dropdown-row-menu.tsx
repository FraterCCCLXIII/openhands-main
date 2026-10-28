import React from "react";
import { useTranslation } from "react-i18next";
import { MoreHorizontal } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

interface BackendDropdownRowMenuProps {
  onManage: () => void;
}

/**
 * Three-dot button revealed on hover (or focus) of a backend dropdown row.
 * Its menu renders inside the row so the dropdown's own click-away handling
 * leaves it alone, and every event stops short of the row so it never selects.
 */
export function BackendDropdownRowMenu({
  onManage,
}: BackendDropdownRowMenuProps) {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);

  const swallow = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <span
      className="relative shrink-0"
      onMouseDown={swallow}
      onTouchStart={swallow}
    >
      <button
        type="button"
        data-testid="backend-dropdown-row-menu-trigger"
        aria-label={t(I18nKey.COMMON$MORE_OPTIONS)}
        aria-expanded={open}
        onClick={(event) => {
          swallow(event);
          setOpen((value) => !value);
        }}
        className={cn(
          "inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-surface-raised hover:text-contrast focus-visible:opacity-100",
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <MoreHorizontal aria-hidden className="size-4" />
      </button>
      {open ? (
        <span
          role="menu"
          className="absolute right-7 top-1/2 z-10 -translate-y-1/2 rounded-md border border-border-subtle bg-surface-raised p-0.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            data-testid="backend-dropdown-row-manage"
            onClick={(event) => {
              swallow(event);
              setOpen(false);
              onManage();
            }}
            className="flex cursor-pointer items-center rounded px-3 py-1 text-sm text-contrast hover:bg-interactive-selected"
          >
            {t(I18nKey.BACKEND$ROW_MANAGE)}
          </button>
        </span>
      ) : null}
    </span>
  );
}
