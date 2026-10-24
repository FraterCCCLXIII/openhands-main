import React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Bug, Settings } from "lucide-react";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { useSettingsNavItems } from "#/hooks/use-settings-nav-items";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { NavigationLink } from "#/components/shared/navigation-link";
import { navInteractiveTransitionClassName } from "./sidebar-layout";
import { SidebarAppearanceMenu } from "./sidebar-appearance-menu";

const REPORT_BUG_URL = "https://github.com/OpenHands/OpenHands/issues/new";
const POPOVER_WIDTH_PX = 280;

interface SidebarSettingsPopoverProps {
  backendId: string;
  userEmail?: string;
}

export function SidebarSettingsPopover({
  backendId,
  userEmail,
}: SidebarSettingsPopoverProps) {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const navItems = useSettingsNavItems();

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

  const handleItemClick = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        data-testid="sidebar-settings-popover-trigger"
        aria-label={t(I18nKey.SIDEBAR$SETTINGS)}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-surface-raised hover:text-contrast"
      >
        <Settings width={16} height={16} className="shrink-0" />
        <span className="truncate">
          {userEmail ?? t(I18nKey.SIDEBAR$SETTINGS)}
        </span>
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              data-testid="sidebar-settings-popover"
              style={menuStyle}
              className="fixed z-50 flex w-70 flex-col rounded-xl border border-border-subtle bg-tertiary shadow-lg overflow-hidden"
            >
              <nav className="flex flex-col py-1">
                {navItems.map((entry) => {
                  if (entry.type !== "item") return null;
                  const item = entry.item;
                  return (
                    <NavigationLink
                      key={item.to}
                      end
                      to={item.to}
                      onClick={handleItemClick}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-3 px-3 py-2",
                          navInteractiveTransitionClassName,
                          isActive ? "bg-surface" : "hover:bg-surface-raised",
                          isActive ? "[&_*]:text-contrast" : "",
                        )
                      }
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted group-hover:text-contrast">
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-muted group-hover:text-contrast">
                        {t(item.text as I18nKey)}
                      </span>
                    </NavigationLink>
                  );
                })}
              </nav>

              <div className="border-t border-border px-3 py-2 flex items-center gap-2">
                <SidebarAppearanceMenu backendId={backendId} />
                <a
                  href={REPORT_BUG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="sidebar-settings-popover-report-bug"
                  aria-label={t(I18nKey.SIDEBAR$REPORT_BUG)}
                  title={t(I18nKey.SIDEBAR$REPORT_BUG)}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-raised hover:text-contrast"
                >
                  <Bug aria-hidden className="size-4" />
                </a>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
