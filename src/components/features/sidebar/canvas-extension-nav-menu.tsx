import React from "react";
import { useTranslation } from "react-i18next";
import { Palette } from "lucide-react";
import { AppearancePortal } from "#/components/shared/appearance-portal";
import { ContextMenuListItem } from "#/components/features/context-menu/context-menu-list-item";
import { FeedIconModal } from "#/components/features/feed/feed-icon-modal";
import { I18nKey } from "#/i18n/declaration";
import { ContextMenu } from "#/ui/context-menu";
import { canvasExtensionIconKey } from "#/utils/feed-icon-keys";

interface CanvasExtensionNavMenuProps {
  /** Extension name, which keys the saved icon. */
  extensionName: string;
  /** Shown under the title in the icon editor. */
  label: string;
  children: React.ReactNode;
}

/**
 * Right-click an app in the left nav to change its icon and background color.
 * The choice is saved in this browser and wins over the app's own preference.
 */
export function CanvasExtensionNavMenu({
  extensionName,
  label,
  children,
}: CanvasExtensionNavMenuProps) {
  const { t } = useTranslation("openhands");
  const [point, setPoint] = React.useState<{ x: number; y: number } | null>(
    null,
  );
  const [editing, setEditing] = React.useState(false);
  const menuRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    if (!point) return undefined;
    const close = (event: Event) => {
      if (
        event.type === "mousedown" &&
        menuRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setPoint(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPoint(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [point]);

  return (
    <div
      data-testid={`canvas-extension-nav-menu-${extensionName}`}
      onContextMenu={(event) => {
        event.preventDefault();
        setPoint({ x: event.clientX, y: event.clientY });
      }}
    >
      {children}
      {point ? (
        <AppearancePortal>
          <div
            style={{ position: "fixed", left: point.x, top: point.y }}
            className="z-50"
          >
            <ContextMenu ref={menuRef} theme="popover" className="min-w-48">
              <li>
                <ContextMenuListItem
                  testId="canvas-extension-nav-customize"
                  onClick={() => {
                    setPoint(null);
                    setEditing(true);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Palette size={14} />
                    {t(I18nKey.FEED$ICON_CUSTOMIZE)}
                  </span>
                </ContextMenuListItem>
              </li>
            </ContextMenu>
          </div>
        </AppearancePortal>
      ) : null}
      {editing ? (
        <FeedIconModal
          iconKey={canvasExtensionIconKey(extensionName)}
          subject={label}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </div>
  );
}
