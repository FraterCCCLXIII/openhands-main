import React from "react";
import { useTranslation } from "react-i18next";
import { EllipsisVertical, Plus, Settings } from "lucide-react";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

interface BackendRowMenuProps {
  onOpenAddBackend: () => void;
  onOpenManageBackends: () => void;
}

/**
 * Three-dot menu beside the backend selector. Holds the account-level actions
 * so they stay reachable while the selector trigger is collapsed.
 */
export function BackendRowMenu({
  onOpenAddBackend,
  onOpenManageBackends,
}: BackendRowMenuProps) {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = useClickOutsideElement<HTMLDivElement>(
    () => setOpen(false),
    anchorRef,
  );

  const items = [
    {
      key: "add",
      label: t(I18nKey.BACKEND$ADD),
      icon: <Plus className="size-4" aria-hidden />,
      onSelect: onOpenAddBackend,
    },
    {
      key: "manage",
      label: t(I18nKey.BACKEND$MANAGE),
      icon: <Settings className="size-4" aria-hidden />,
      onSelect: onOpenManageBackends,
    },
  ];

  return (
    <div className="relative shrink-0">
      <button
        ref={anchorRef}
        type="button"
        data-testid="backend-row-menu-trigger"
        aria-label={t(I18nKey.COMMON$MORE_OPTIONS)}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface-raised hover:text-contrast"
      >
        <EllipsisVertical className="size-4" aria-hidden />
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          data-testid="backend-row-menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-40 rounded-xl border border-border-subtle bg-tertiary p-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              data-testid={`backend-row-menu-${item.key}`}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-contrast hover:bg-surface-raised",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
