import React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Book, Bug, Settings } from "lucide-react";
import { useSettingsNavItems } from "#/hooks/use-settings-nav-items";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { NavigationLink } from "#/components/shared/navigation-link";
import { navInteractiveTransitionClassName } from "./sidebar-layout";
import { SidebarAppearanceMenu } from "./sidebar-appearance-menu";

const REPORT_BUG_URL = "https://github.com/OpenHands/OpenHands/issues/new";
const DOCS_URL = "https://docs.openhands.dev/";
const POPOVER_WIDTH_PX = 280;
const HOVER_CLOSE_DELAY_MS = 150;

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
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  };

  const handleItemClick = () => {
    setOpen(false);
  };

  const linkRowClassName =
    "group flex items-center gap-3 px-3 py-2 text-muted hover:bg-surface-raised hover:text-contrast";

  return (
    <div
      ref={anchorRef}
      className="relative min-w-0 flex-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        data-testid="sidebar-settings-popover-trigger"
        aria-label={t(I18nKey.SIDEBAR$SETTINGS)}
        aria-expanded={open}
        className="inline-flex h-9 w-full min-w-0 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-surface-raised hover:text-contrast"
      >
        <Settings width={16} height={16} className="shrink-0" />
        <span className="truncate">
          {userEmail ?? t(I18nKey.SIDEBAR$SETTINGS)}
        </span>
      </button>

      {open
        ? createPortal(
            <div
              data-testid="sidebar-settings-popover"
              style={menuStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
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

              <div className="border-t border-border flex flex-col py-1">
                <SidebarAppearanceMenu backendId={backendId} asRow />
                <a
                  href={DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="sidebar-settings-popover-docs"
                  className={linkRowClassName}
                >
                  <Book aria-hidden className="size-5" />
                  <span className="text-sm">{t(I18nKey.SIDEBAR$DOCS)}</span>
                </a>
                <a
                  href={REPORT_BUG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="sidebar-settings-popover-report-bug"
                  className={linkRowClassName}
                >
                  <Bug aria-hidden className="size-5" />
                  <span className="text-sm">
                    {t(I18nKey.SIDEBAR$REPORT_BUG)}
                  </span>
                </a>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
